#import "LocalMediaServer.h"
#import <GCDWebServer/GCDWebServer.h>
#import <GCDWebServer/GCDWebServerDataResponse.h>
#import <GCDWebServer/GCDWebServerFileResponse.h>
#import <ImageIO/ImageIO.h>
#import <UIKit/UIKit.h>
#import <AVFoundation/AVFoundation.h>

@interface LocalMediaServer ()
@property (nonatomic, strong) GCDWebServer *webServer;
@property (nonatomic, copy) NSData *cachedData;
@property (nonatomic, copy) NSString *cachedContentType;
@property (nonatomic, copy) NSString *cachedFilePath;
@property (nonatomic, copy) NSString *tempOutputPath;
@end

@implementation LocalMediaServer

RCT_EXPORT_MODULE();

- (instancetype)init {
  self = [super init];
  if (self) {
    _webServer = [[GCDWebServer alloc] init];
  }
  return self;
}

- (NSURL *)fileURLFromPath:(NSString *)path {
  if ([path hasPrefix:@"file://"]) {
    return [NSURL URLWithString:path];
  }
  return [NSURL fileURLWithPath:path];
}

- (NSData *)jpegDataFromFile:(NSString *)path maxDimension:(CGFloat)maxDim {
  NSURL *url = [self fileURLFromPath:path];
  if (!url) return nil;

  CGImageSourceRef source = CGImageSourceCreateWithURL((__bridge CFURLRef)url, NULL);
  if (!source) return nil;

  NSDictionary *options = @{
    (__bridge id)kCGImageSourceThumbnailMaxPixelSize: @(maxDim),
    (__bridge id)kCGImageSourceCreateThumbnailFromImageAlways: @YES,
    (__bridge id)kCGImageSourceCreateThumbnailWithTransform: @YES,
  };

  CGImageRef thumb = CGImageSourceCreateThumbnailAtIndex(source, 0,
    (__bridge CFDictionaryRef)options);
  CFRelease(source);

  if (!thumb) return nil;

  NSData *jpeg = UIImageJPEGRepresentation([UIImage imageWithCGImage:thumb], 0.85);
  CGImageRelease(thumb);
  return jpeg;
}

- (void)transcodeVideo:(NSString *)inputPath
            completion:(void (^)(NSString *outputPath, NSError *error))completion {
  NSURL *inputURL = [self fileURLFromPath:inputPath];
  AVURLAsset *asset = [AVURLAsset URLAssetWithURL:inputURL options:nil];
  if (!asset) {
    completion(nil, [NSError errorWithDomain:@"LMS" code:1
      userInfo:@{NSLocalizedDescriptionKey: @"Cannot create asset from video"}]);
    return;
  }

  NSString *filename = [NSString stringWithFormat:@"ipcast_tc_%@.mp4",
                                                  [[NSUUID UUID] UUIDString]];
  NSString *outputPath = [NSTemporaryDirectory() stringByAppendingPathComponent:filename];
  [[NSFileManager defaultManager] removeItemAtPath:outputPath error:nil];

  AVAssetExportSession *session = [[AVAssetExportSession alloc]
    initWithAsset:asset presetName:AVAssetExportPresetHighestQuality];
  session.outputURL = [NSURL fileURLWithPath:outputPath];
  session.outputFileType = AVFileTypeMPEG4;
  session.shouldOptimizeForNetworkUse = YES;

  [session exportAsynchronouslyWithCompletionHandler:^{
    dispatch_async(dispatch_get_main_queue(), ^{
      if (session.status == AVAssetExportSessionStatusCompleted) {
        completion(outputPath, nil);
      } else {
        [[NSFileManager defaultManager] removeItemAtPath:outputPath error:nil];
        completion(nil, session.error);
      }
    });
  }];
}

- (void)startWebServer:(NSInteger)port
              resolver:(RCTPromiseResolveBlock)resolve
              rejecter:(RCTPromiseRejectBlock)reject {
  [self.webServer removeAllHandlers];

  __weak typeof(self) weakSelf = self;
  [self.webServer addDefaultHandlerForMethod:@"GET"
                                requestClass:[GCDWebServerRequest class]
                                processBlock:^GCDWebServerResponse *(GCDWebServerRequest *request) {
    __strong typeof(weakSelf) strongSelf = weakSelf;
    if (!strongSelf) {
      return [GCDWebServerDataResponse responseWithStatusCode:500];
    }
    if (strongSelf.cachedData) {
      return [GCDWebServerDataResponse responseWithData:strongSelf.cachedData
                                           contentType:strongSelf.cachedContentType];
    }
    if (strongSelf.cachedFilePath) {
      GCDWebServerFileResponse *response =
        [GCDWebServerFileResponse responseWithFile:strongSelf.cachedFilePath];
      response.contentType = strongSelf.cachedContentType;
      return response;
    }
    return [GCDWebServerDataResponse responseWithStatusCode:500];
  }];

  NSError *error = nil;
  NSMutableDictionary *options = [NSMutableDictionary dictionary];
  options[GCDWebServerOption_Port] = @(port);
  options[GCDWebServerOption_BindToLocalhost] = @NO;

  BOOL success = [self.webServer startWithOptions:options error:&error];

  if (success) {
    resolve(self.webServer.serverURL.absoluteString);
  } else {
    reject(@"SERVER_ERROR",
           error.localizedDescription ?: @"Failed to start server",
           error);
  }
}

RCT_EXPORT_METHOD(startServer:(NSInteger)port
                  filePath:(NSString *)filePath
                  contentType:(NSString *)contentType
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  if (self.webServer.isRunning) {
    [self.webServer stop];
  }

  [self.webServer removeAllHandlers];
  [self cleanupTempOutput];
  self.cachedData = nil;
  self.cachedFilePath = nil;
  self.cachedContentType = contentType;

  // Strip file:// prefix for filesystem operations
  NSString *fsPath = filePath;
  if ([fsPath hasPrefix:@"file://"]) {
    fsPath = [fsPath substringFromIndex:7];
  }

  if ([contentType hasPrefix:@"image/"]) {
    NSData *jpeg = [self jpegDataFromFile:fsPath maxDimension:1920];
    if (jpeg) {
      self.cachedData = jpeg;
      self.cachedContentType = @"image/jpeg";
    }
    [self startWebServer:port resolver:resolve rejecter:reject];
  } else if ([contentType hasPrefix:@"video/"]) {
    // Transcode to H.264 MP4 for Cast device compatibility.
    // iPhone recordings are HEVC/MOV which Chromecast can't decode.
    [self transcodeVideo:fsPath completion:^(NSString *outputPath, NSError *error) {
      if (outputPath) {
        self.tempOutputPath = outputPath;
        self.cachedFilePath = outputPath;
        self.cachedContentType = @"video/mp4";
        [self startWebServer:port resolver:resolve rejecter:reject];
      } else {
        // Transcoding failed — serve the original file as fallback
        self.cachedFilePath = fsPath;
        [self startWebServer:port resolver:resolve rejecter:reject];
      }
    }];
  } else {
    if (!self.cachedData) {
      self.cachedFilePath = fsPath;
    }
    [self startWebServer:port resolver:resolve rejecter:reject];
  }
}

RCT_EXPORT_METHOD(generateThumbnail:(NSString *)filePath
                  maxWidth:(NSInteger)maxWidth
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  NSString *fsPath = filePath;
  if ([fsPath hasPrefix:@"file://"]) {
    fsPath = [fsPath substringFromIndex:7];
  }

  NSURL *url = [self fileURLFromPath:fsPath];
  AVURLAsset *asset = [AVURLAsset URLAssetWithURL:url options:nil];
  if (!asset) {
    reject(@"THUMB_ERROR", @"Cannot open video", nil);
    return;
  }

  AVAssetImageGenerator *gen = [[AVAssetImageGenerator alloc] initWithAsset:asset];
  gen.appliesPreferredTrackTransform = YES;
  gen.maximumSize = CGSizeMake(maxWidth, maxWidth);
  gen.requestedTimeToleranceBefore = kCMTimePositiveInfinity;
  gen.requestedTimeToleranceAfter = kCMTimePositiveInfinity;

  CMTime time = CMTimeMake(1, 2); // 0.5 seconds in

  [gen generateCGImagesAsynchronouslyForTimes:@[[NSValue valueWithCMTime:time]]
                            completionHandler:^(CMTime requestedTime, CGImageRef image, CMTime actualTime, AVAssetImageGeneratorResult result, NSError *error) {
    if (result != AVAssetImageGeneratorSucceeded || !image) {
      dispatch_async(dispatch_get_main_queue(), ^{
        reject(@"THUMB_ERROR", error.localizedDescription ?: @"Failed to generate thumbnail", error);
      });
      return;
    }

    UIImage *uiImage = [UIImage imageWithCGImage:image];
    NSData *jpeg = UIImageJPEGRepresentation(uiImage, 0.8);

    NSString *cacheDir = NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES).firstObject;
    NSString *filename = [NSString stringWithFormat:@"thumb_%@.jpg", [[NSUUID UUID] UUIDString]];
    NSString *outputPath = [cacheDir stringByAppendingPathComponent:filename];

    if ([jpeg writeToFile:outputPath atomically:YES]) {
      dispatch_async(dispatch_get_main_queue(), ^{
        resolve([NSURL fileURLWithPath:outputPath].absoluteString);
      });
    } else {
      dispatch_async(dispatch_get_main_queue(), ^{
        reject(@"THUMB_ERROR", @"Failed to write thumbnail", nil);
      });
    }
  }];
}

- (void)cleanupTempOutput {
  if (self.tempOutputPath) {
    [[NSFileManager defaultManager] removeItemAtPath:self.tempOutputPath error:nil];
    self.tempOutputPath = nil;
  }
}

RCT_EXPORT_METHOD(stopServer:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  if (self.webServer.isRunning) {
    [self.webServer stop];
  }
  [self.webServer removeAllHandlers];
  self.cachedData = nil;
  self.cachedFilePath = nil;
  self.cachedContentType = nil;
  [self cleanupTempOutput];
  resolve(nil);
}

- (void)dealloc {
  [self cleanupTempOutput];
  [self.webServer stop];
}

@end
