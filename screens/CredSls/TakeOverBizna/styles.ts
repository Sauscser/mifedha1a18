import { StyleSheet, Dimensions } from 'react-native';
const screenWidth = Dimensions.get('screen').width;
const styles = StyleSheet.create({
  image: {
    flex: 1,
    width: '100%',
    minHeight: '100%',
    paddingTop: 20,
    paddingBottom: 40,
    backgroundColor: '#eef6ff',
    alignItems: 'center'
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1f2937'
  },
  loanTitleView: {
    backgroundColor: '#ffffff',
    width: screenWidth - 30,
    borderRadius: 20,
    marginTop: 16,
    paddingVertical: 18,
    paddingHorizontal: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3
  },
  sendAmtViewDesc: {
    backgroundColor: '#ffffff',
    width: screenWidth - 30,
    borderRadius: 18,
    marginTop: 14,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3
  },
  sendAmtInputDesc: {
    backgroundColor: '#f8fafc',
    width: '100%',
    minHeight: 110,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 10,
    fontSize: 16,
    color: '#0f172a',
    textAlignVertical: 'top'
  },
  sendLoanView: {
    backgroundColor: '#ffffff',
    width: screenWidth - 30,
    borderRadius: 18,
    marginTop: 14,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3
  },
  sendLoanText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 12
  },
  sendLoanButton: {
    backgroundColor: '#2563eb',
    height: 54,
    borderRadius: 18,
    width: screenWidth - 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 4
  },
  sendLoanButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  sendLoanInput: {
    backgroundColor: '#f8fafc',
    width: '100%',
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 10,
    fontSize: 16,
    color: '#0f172a'
  },
  loanSpecificationsTextInput: {
    backgroundColor: '#f8fafc',
    width: '100%',
    minHeight: 170,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 10,
    fontSize: 16,
    color: '#0f172a',
    textAlignVertical: 'top'
  },
  loanSpecificationView: {
    backgroundColor: '#ffffff',
    width: screenWidth - 30,
    borderRadius: 18,
    marginTop: 14,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20
  }
});
export default styles;