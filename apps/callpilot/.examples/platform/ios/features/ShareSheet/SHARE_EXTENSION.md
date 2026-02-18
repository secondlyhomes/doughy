# iOS Share Extension Setup

Share content to and from your app using the native iOS share sheet.

## Features

- Share text, URLs, images, files
- Activity items (Messages, Mail, etc.)
- Custom share actions
- Share extensions

## Requirements

- iOS 8+ for Share Sheet
- iOS 13+ for custom activities
- react-native Share API

## Setting Up a Share Extension

To receive shared content in your app:

### 1. Add Share Extension Target in Xcode

File -> New -> Target -> Share Extension

### 2. Configure Info.plist

```xml
<key>NSExtension</key>
<dict>
  <key>NSExtensionAttributes</key>
  <dict>
    <key>NSExtensionActivationRule</key>
    <dict>
      <key>NSExtensionActivationSupportsWebURLWithMaxCount</key>
      <integer>1</integer>
      <key>NSExtensionActivationSupportsText</key>
      <true/>
      <key>NSExtensionActivationSupportsImageWithMaxCount</key>
      <integer>1</integer>
    </dict>
  </dict>
  <key>NSExtensionPointIdentifier</key>
  <string>com.apple.share-services</string>
  <key>NSExtensionPrincipalClass</key>
  <string>ShareViewController</string>
</dict>
```

### 3. Implement ShareViewController.swift

```swift
import UIKit
import Social

class ShareViewController: SLComposeServiceViewController {

  override func isContentValid() -> Bool {
    return true
  }

  override func didSelectPost() {
    // Get shared content
    if let item = extensionContext?.inputItems.first as? NSExtensionItem {
      if let attachments = item.attachments {
        for attachment in attachments {
          // Handle URL
          if attachment.hasItemConformingToTypeIdentifier("public.url") {
            attachment.loadItem(forTypeIdentifier: "public.url") { (url, error) in
              if let shareURL = url as? URL {
                // Save URL to shared container
                self.saveSharedContent(url: shareURL)
              }
            }
          }

          // Handle text
          if attachment.hasItemConformingToTypeIdentifier("public.text") {
            attachment.loadItem(forTypeIdentifier: "public.text") { (text, error) in
              if let shareText = text as? String {
                // Save text to shared container
                self.saveSharedContent(text: shareText)
              }
            }
          }
        }
      }
    }

    // Complete extension
    extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
  }

  override func configurationItems() -> [Any]! {
    // Add custom configuration options
    return []
  }

  private func saveSharedContent(url: URL) {
    // Save to App Group shared container
    if let sharedContainer = FileManager.default.containerURL(
      forSecurityApplicationGroupIdentifier: "group.com.yourapp.shared"
    ) {
      let dataPath = sharedContainer.appendingPathComponent("shared_data.json")
      let data = ["url": url.absoluteString, "timestamp": Date().timeIntervalSince1970]

      if let jsonData = try? JSONSerialization.data(withJSONObject: data) {
        try? jsonData.write(to: dataPath)
      }
    }
  }

  private func saveSharedContent(text: String) {
    // Save text to shared container
    if let sharedContainer = FileManager.default.containerURL(
      forSecurityApplicationGroupIdentifier: "group.com.yourapp.shared"
    ) {
      let dataPath = sharedContainer.appendingPathComponent("shared_data.json")
      let data = ["text": text, "timestamp": Date().timeIntervalSince1970]

      if let jsonData = try? JSONSerialization.data(withJSONObject: data) {
        try? jsonData.write(to: dataPath)
      }
    }
  }
}
```

### 4. Read Shared Content in React Native

```typescript
import { NativeModules } from 'react-native';

async function checkForSharedContent() {
  try {
    const sharedData = await NativeModules.ShareExtension.getSharedData();

    if (sharedData) {
      if (sharedData.url) {
        // Handle shared URL
        console.log('Shared URL:', sharedData.url);
      }

      if (sharedData.text) {
        // Handle shared text
        console.log('Shared text:', sharedData.text);
      }

      // Clear shared data
      await NativeModules.ShareExtension.clearSharedData();
    }
  } catch (error) {
    console.error('Failed to check shared content:', error);
  }
}

// Check on app launch
useEffect(() => {
  checkForSharedContent();
}, []);
```
