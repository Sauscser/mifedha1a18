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
  card: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
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
  title: {
    color: '#123B4A',
    fontSize: 26,
    fontWeight: '800'
  },
  subtitle: {
    color: '#55727E',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 24
  },
  field: {
    marginBottom: 18
  },
  label: {
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
  button: {
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
  buttonDisabled: {
    opacity: 0.75
  },
  buttonIndicator: {
    marginRight: 10
  },
  buttonText: {
    color: '#123B4A',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center'
  }
});

export default styles;
