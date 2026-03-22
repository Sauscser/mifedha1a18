// styles.js
import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'skyblue', // overall background
  },
  image: {
    flex: 1,
    padding: 16,
  },
  accountView: {
    marginVertical: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f0f8ff', // light skyblue tint
    borderWidth: 1,
    borderColor: '#e28d58',
  },
  accountText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#e28d58',
    marginBottom: 16,
    textAlign: 'center',
  },
  acPressables: {
    marginVertical: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e28d58',
  },
  acPressableText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e28d58',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  acNonLnsPressables: {
    flex: 1,
    marginHorizontal: 6,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#e28d58',
    alignItems: 'center',
    justifyContent: 'center',
    width: width * 0.35,
  },
  acNonLnsPressablesText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
