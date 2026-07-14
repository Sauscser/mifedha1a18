import { StyleSheet } from 'react-native';
const styles = StyleSheet.create({
  image: {
    flex: 1,
    width: '100%'
  },
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center'
  },
  scrollContent: {
    paddingBottom: 20
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#e58d29',
    textAlign: 'center',
    marginBottom: 12
  },
  sendAmtView: {
    marginBottom: 12
  },
  sendAmtText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
    marginLeft: 2
  },
  sendAmtInput: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#222'
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 2
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 10,
    color: '#222'
  },
  sendAmtButton: {
    backgroundColor: '#e58d29',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6
  },
  sendAmtButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff'
  },
  sendAmtViewDesc: {
    marginBottom: 12
  },
  sendAmtInputDesc: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 90,
    color: '#222'
  }
});
export default styles;