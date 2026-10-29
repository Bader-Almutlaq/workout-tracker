import Foundation

/// Small synthetic Strong exports. Each mimics a quirk of real exports
/// (documented in `docs/DATA.md`) without using the owner's data.
enum StrongFixtures {
    /// Older comma layout. Two workouts:
    /// - Bench (kg column) with one set typed in lb (61.23 = 135 lb), a warm-up and a failure set.
    /// - Leg curl (lb column): 99.21 = 45 kg typed in kg, 140 typed in lb.
    /// - A workout note and a quoted name containing a comma.
    static let olderLayout = """
        Date,Workout Name,Duration,Exercise Name,Set Order,Weight,Reps,Distance,Seconds,Notes,Workout Notes,RPE
        2024-01-01 10:00:00,"Push, heavy",1h 7m,"Bench Press (Barbell)",W,40.0,10.0,0,0.0,"","Felt good",
        2024-01-01 10:00:00,"Push, heavy",1h 7m,"Bench Press (Barbell)",1,61.23,8.0,0,0.0,,,8
        2024-01-01 10:00:00,"Push, heavy",1h 7m,"Bench Press (Barbell)",F,60.0,6.0,0,0.0,,,10
        2024-01-01 10:00:00,"Push, heavy",1h 7m,"Seated Leg Curl (Machine)",1,99.21,12.0,0,0.0,"",,7
        2024-01-08 10:00:00,"Legs",59m,"Seated Leg Curl (Machine)",1,140.0,10.0,0,0.0,"",,8
        2024-01-08 10:00:00,"Legs",59m,"Seated Leg Curl (Machine)",D,63.93,15.0,0,0.0,"",,
        """

    /// Newer semicolon layout with "Workout #", a Note row and a Rest Timer row.
    static let newerLayout = """
        "Workout #";"Date";"Workout Name";"Duration (sec)";"Exercise Name";"Set Order";"Weight (kg)";"Reps";"RPE";"Distance (meters)";"Seconds";"Notes";"Workout Notes"
        "1";"2026-03-02 18:30:00";"Pull";"3600";"Lat Pulldown (Cable)";"1";"60";"10";"8.5";"";"";"";""
        "1";"2026-03-02 18:30:00";"Pull";"3600";"Lat Pulldown (Cable)";"Note";"";"";"";"";"";"Use the wide bar";""
        "1";"2026-03-02 18:30:00";"Pull";"3600";"Lat Pulldown (Cable)";"Rest Timer";"";"";"";"";"120";"";""
        "1";"2026-03-02 18:30:00";"Pull";"3600";"Lat Pulldown (Cable)";"2";"60";"9";"9";"";"";"";""
        """

    /// One measurement file, Strong's per-site layout.
    static let waist = """
        Date,Measurement Type,Value,Unit,Source
        2026-02-18 09:13:35,Waist,78,cm,Strong
        2025-07-11 11:16:13,Waist,31,in,Strong
        """

    /// A UTC zone so fixture timestamps parse identically on every machine.
    static let utc = TimeZone(identifier: "UTC") ?? .gmt

    /// Ten weekly squat sessions at ~100 kg with one typo (1000 kg) in week 5.
    static func squatHistoryWithTypo() -> String {
        var lines = ["Date,Workout Name,Duration,Exercise Name,Set Order,Weight,Reps,Distance,Seconds,Notes,Workout Notes,RPE"]
        for week in 0..<10 {
            let day = String(format: "2025-01-%02d 10:00:00", 1 + week * 3)
            let typo = week == 5
            lines.append("\(day),Legs,1h,Squat (Barbell),1,\(typo ? "1000.0" : "100.0"),5.0,0,0.0,,,8")
            lines.append("\(day),Legs,1h,Squat (Barbell),2,100.0,5.0,0,0.0,,,8")
        }
        return lines.joined(separator: "\n")
    }
}
