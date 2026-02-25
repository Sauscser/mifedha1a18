import { StyleSheet, Dimensions, Platform } from 'react-native';
const { height } = Dimensions.get('window');
const isCompact = height < 700;
const spacing = isCompact ? 8 : 12;
const buttonPadding = isCompact ? 8 : 12;
const titleSize = isCompact ? 16 : 18;
const bodySize = isCompact ? 13 : 16;
const styles = StyleSheet.create({
  // Background and container for the entire page
  adminImage: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    paddingTop: isCompact ? 8 : 16
  },
  // View for each section with shadows and rounded corners
  clientsView: {
    marginBottom: spacing,
    padding: spacing,
    backgroundColor: 'white',
    borderRadius: isCompact ? 8 : 10,
    elevation: 5,
    shadowColor: 'black',
    shadowOpacity: 0.1,
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowRadius: 10,
    alignItems: 'center',
    // Center all items horizontally
    justifyContent: 'center' // Center all items vertically
  },
  // Section title text
  salesText: {
    fontSize: titleSize + 2,
    fontWeight: 'bold',
    color: '#FF8C00',
    // Orange
    marginBottom: spacing,
    textTransform: 'uppercase',
    textAlign: 'center' // Center the title text
  },
  // Container for categories (Grant Loans, Loan Statuses, etc.)
  viewForClientsAndTitle: {
    flexDirection: 'column',
    alignItems: 'center',
    // Center all categories horizontally
    justifyContent: 'center' // Center categories vertically
  },
  // Categories view (each category like "Grant Loan Requests")
  viewForClientsCategories: {
    marginBottom: spacing,
    paddingHorizontal: spacing,
    alignItems: 'center',
    // Center categories horizontally
    justifyContent: 'center' // Center categories vertically
  },
  // Text for category titles (e.g., "Grant Loan Requests")
  salesPressableText: {
    fontSize: titleSize,
    fontWeight: '600',
    color: '#1E90FF',
    // Sky Blue
    marginBottom: isCompact ? 6 : 8,
    textAlign: 'center' // Center the category title text
  },
  // Container for all pressable buttons in a category
  viewForClientsPressables: {
    flexDirection: 'column',
    alignItems: 'center',
    // Center all buttons horizontally
    justifyContent: 'center',
    // Center buttons vertically
    width: '100%' // Ensure the buttons are aligned across the full width
  },
  // Base style for each button (Pressable)
  ClientsPressables: {
    paddingVertical: buttonPadding,
    borderRadius: isCompact ? 6 : 8,
    marginBottom: isCompact ? 8 : 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF8C00',
    // Default orange background
    elevation: 3,
    // Elevation for shadow
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: {
      width: 0,
      height: 4
    },
    shadowRadius: 5
  },
  // Text inside the pressable buttons
  clientsPressableText: {
    fontSize: bodySize,
    color: 'white',
    fontWeight: '600',
    textAlign: 'center'
  },
  // Linear gradient style for each button for the professional look
  clientsPressableGradient: {
    borderRadius: isCompact ? 6 : 8,
    paddingVertical: buttonPadding,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: isCompact ? 8 : 12,
    width: isCompact ? '92%' : '85%' // Make the buttons take up more space for a cleaner look
  },
  // Gradient style for the buttons (orange to sky blue)
  gradientPressable: {
    borderRadius: isCompact ? 6 : 8,
    paddingVertical: buttonPadding,
    width: isCompact ? '92%' : '85%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: isCompact ? 8 : 12
  }
});
export default styles;