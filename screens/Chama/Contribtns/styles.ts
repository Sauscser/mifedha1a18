import { StyleSheet, Dimensions } from 'react-native';
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f7f7f7',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'white',
    width: '100%',
    minHeight: 44,
    borderRadius: 8,
    marginBottom: 18,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputDesc: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#1e90ff',
    borderRadius: 24,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
    marginBottom: 24,
    elevation: 2,
    flexDirection: 'row',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
});
export default styles;