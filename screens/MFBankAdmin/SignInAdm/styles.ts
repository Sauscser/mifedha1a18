import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e29d58',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e29d58',
    marginBottom: 24,
  },
  input: {
    width: '100%',
    height: 48,
    borderColor: '#e29d58',
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#f7fafc',
  },
  label: {
    alignSelf: 'flex-start',
    fontSize: 14,
    color: '#1e293b',
    marginBottom: 4,
    marginLeft: 2,
  },
  button: {
    backgroundColor: 'skyblue',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginTop: 12,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  goHome: {
    marginBottom: 16,
    alignSelf: 'flex-end',
  },
  goHomeText: {
    color: 'skyblue',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default styles;
