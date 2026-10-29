// Renders an SVG to a square PNG with AppKit (no third-party tools).
// Usage: swift tools/render-svg.swift <input.svg> <output.png> <pixels>
import AppKit

let arguments = CommandLine.arguments
guard arguments.count == 4, let pixels = Int(arguments[3]), let image = NSImage(contentsOfFile: arguments[1]) else {
    FileHandle.standardError.write(Data("usage: render-svg <input.svg> <output.png> <pixels>\n".utf8))
    exit(1)
}
guard let bitmap = NSBitmapImageRep(
    bitmapDataPlanes: nil, pixelsWide: pixels, pixelsHigh: pixels, bitsPerSample: 8, samplesPerPixel: 4,
    hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0
) else { exit(1) }
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: bitmap)
image.draw(in: NSRect(x: 0, y: 0, width: pixels, height: pixels))
NSGraphicsContext.restoreGraphicsState()
guard let png = bitmap.representation(using: .png, properties: [:]) else { exit(1) }
try png.write(to: URL(fileURLWithPath: arguments[2]))
