extension String {
    /// `nil` when the string is empty. Used for optional text columns.
    var nilIfEmpty: String? { isEmpty ? nil : self }
}
