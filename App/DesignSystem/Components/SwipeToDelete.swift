import SwiftUI

extension View {
    /// Lets the row be swiped left to reveal a Delete button; a long swipe deletes at once.
    ///
    /// Plain `swipeActions` only works inside a `List`, and the logging screen lays its cards
    /// out in a scroll view, so this does the same with a horizontal drag. The drag only
    /// engages when it is mostly horizontal, so vertical scrolling is unaffected.
    func swipeToDelete(accessibilityName: String, onDelete: @escaping () -> Void) -> some View {
        modifier(SwipeToDelete(accessibilityName: accessibilityName, onDelete: onDelete))
    }
}

private struct SwipeToDelete: ViewModifier {
    /// Spoken name of the delete action, e.g. "Delete set".
    let accessibilityName: String
    let onDelete: () -> Void

    /// How far the row slides to reveal the button.
    private static let revealWidth: CGFloat = 80
    /// Drag distance beyond which letting go deletes without a second tap.
    private static let deleteDistance: CGFloat = 200
    /// Drag distance before the gesture starts, so taps on the row's buttons still work.
    private static let activationDistance: CGFloat = 12
    /// A drag counts as horizontal when its width is at least this multiple of its height.
    private static let horizontalBias: CGFloat = 1.5

    @State private var offset: CGFloat = 0
    /// Where the row rests between drags: 0 closed, or minus the reveal width when open.
    @State private var restingOffset: CGFloat = 0
    @State private var isDraggingHorizontally = false

    func body(content: Content) -> some View {
        ZStack(alignment: .trailing) {
            Button(role: .destructive, action: delete) {
                Image(systemName: "trash")
                    .font(AppFont.headline)
                    .foregroundStyle(.white)
                    .frame(width: Self.revealWidth)
                    .frame(maxHeight: .infinity)
                    .background(AppColor.Status.critical)
            }
            .opacity(offset < 0 ? 1 : 0)
            .accessibilityHidden(true)

            content
                .background(AppColor.surface)
                .offset(x: offset)
                .simultaneousGesture(drag)
        }
        .clipped()
        .accessibilityAction(named: accessibilityName, delete)
    }

    private var drag: some Gesture {
        DragGesture(minimumDistance: Self.activationDistance)
            .onChanged { value in
                if !isDraggingHorizontally {
                    guard abs(value.translation.width) >= abs(value.translation.height) * Self.horizontalBias else { return }
                    isDraggingHorizontally = true
                }
                offset = min(0, restingOffset + value.translation.width)
            }
            .onEnded { value in
                defer { isDraggingHorizontally = false }
                guard isDraggingHorizontally else { return }
                let final = min(0, restingOffset + value.translation.width)
                if -final >= Self.deleteDistance {
                    delete()
                } else {
                    restingOffset = -final > Self.revealWidth / 2 ? -Self.revealWidth : 0
                    withAnimation(Motion.standard) { offset = restingOffset }
                }
            }
    }

    private func delete() {
        withAnimation(Motion.standard) {
            offset = 0
            restingOffset = 0
        }
        onDelete()
    }
}
