import Foundation

/// The timestamp format Strong uses in every export: `yyyy-MM-dd HH:mm:ss`, local time.
enum StrongTimestamp {
    /// A formatter for Strong timestamps. Create one per parse: `DateFormatter`
    /// isn't safe to share across threads.
    /// - Parameter timeZone: Zone the export was written in (the device's, normally).
    static func makeFormatter(timeZone: TimeZone) -> DateFormatter {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = timeZone
        formatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
        return formatter
    }
}
