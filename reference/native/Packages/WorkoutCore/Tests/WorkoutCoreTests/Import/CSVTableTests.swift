import Testing
@testable import WorkoutCore

@Suite("CSV parsing")
struct CSVTableTests {
    @Test("Quoted fields may contain the delimiter, line breaks and doubled quotes")
    func quotedFields() throws {
        let table = try CSVTable(parsing: "a,b,c\n\"x, y\",\"line1\nline2\",\"say \"\"hi\"\"\"")
        #expect(table.rows == [["x, y", "line1\nline2", "say \"hi\""]])
    }

    @Test("Semicolon delimiter is detected from the header")
    func detectsSemicolons() throws {
        let table = try CSVTable(parsing: "\"a\";\"b\"\n\"1,5\";\"2\"")
        #expect(table.header == ["a", "b"])
        #expect(table.rows == [["1,5", "2"]])
    }

    @Test("BOM, CRLF line endings, blank lines and short rows are handled")
    func toleratesFormatting() throws {
        let table = try CSVTable(parsing: "\u{FEFF}a,b,c\r\n1,2\r\n\r\n3,4,5\r\n")
        #expect(table.header == ["a", "b", "c"])
        #expect(table.rows == [["1", "2", ""], ["3", "4", "5"]])
    }

    @Test("Column lookup is case-insensitive")
    func columnLookup() throws {
        let table = try CSVTable(parsing: "Date,Exercise Name\n")
        #expect(table.columnIndex("exercise name") == 1)
        #expect(table.columnIndex("Missing") == nil)
    }

    @Test("An unterminated quote and an empty file are errors")
    func errors() {
        #expect(throws: ImportError.unterminatedQuote(line: 2)) { try CSVTable(parsing: "a,b\n\"open,1") }
        #expect(throws: ImportError.emptyFile) { try CSVTable(parsing: "") }
    }
}
