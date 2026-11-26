import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#EFF9FD'
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 28
  },
  homeButton: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 28,
    borderRadius: 22,
    backgroundColor: '#DDF5FE',
    borderWidth: 1,
    borderColor: '#B8E8F8'
  },
  homeButtonText: {
    color: '#126782',
    fontSize: 14,
    fontWeight: '700'
  },
  heading: {
    color: '#123B4A',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 0.2
  },
  card: {
    width: '100%',
    padding: 22,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCEFF5',
    shadowColor: '#17637B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 4
  },
  accent: {
    width: 46,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#29e58d',
    marginBottom: 22
  },
  field: {
    marginBottom: 18
  },
  fieldLabel: {
    color: '#244C5B',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8
  },
  input: {
    width: '100%',
    minHeight: 52,
    paddingHorizontal: 15,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#B8E3F2',
    backgroundColor: '#F7FCFE',
    color: '#123B4A',
    fontSize: 16
  },
  passwordContainer: {
    position: 'relative',
    justifyContent: 'center'
  },
  passwordInput: {
    paddingRight: 76
  },
  passwordToggle: {
    position: 'absolute',
    right: 12,
    padding: 8
  },
  passwordToggleText: {
    color: '#126782',
    fontSize: 13,
    fontWeight: '700'
  },
  signInButton: {
    minHeight: 54,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
    borderRadius: 15,
    backgroundColor: '#29e58d',
    shadowColor: '#168A58',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 9,
    elevation: 3
  },
  signInButtonDisabled: {
    opacity: 0.75
  },
  signInIndicator: {
    marginRight: 10
  },
  signInButtonText: {
    color: '#123B4A',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2
  },
  footer: {
    color: '#64808A',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 18
  }
});

export default styles;
