import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F3F8FB'
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 32
  },
  card: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E1EBF0',
    borderWidth: 1,
    borderTopColor: '#29E58D',
    borderTopWidth: 4,
    borderRadius: 20,
    padding: 22,
    shadowColor: '#17384D',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 26
  },
  headerAccent: {
    width: 5,
    height: 32,
    borderRadius: 3,
    backgroundColor: '#87CEEB',
    marginRight: 13
  },
  title: {
    flex: 1,
    color: '#17384D',
    fontSize: 21,
    fontWeight: '700'
  },
  field: {
    marginBottom: 19
  },
  fieldLabel: {
    color: '#385466',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8
  },
  input: {
    minHeight: 52,
    backgroundColor: '#F8FBFC',
    borderColor: '#D7E4EA',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    color: '#17384D',
    fontSize: 16
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  passwordInput: {
    flex: 1
  },
  passwordToggle: {
    width: 48,
    height: 52,
    marginLeft: 8,
    borderColor: '#D7E4EA',
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: '#F8FBFC',
    alignItems: 'center',
    justifyContent: 'center'
  },
  button: {
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#29E58D',
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#167A51',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 2
  },
  buttonText: {
    color: '#123B2A',
    fontSize: 16,
    fontWeight: '700'
  }
});

export default styles;
