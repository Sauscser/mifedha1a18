import { StyleSheet } from 'react-native';
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F4F9FC'
  },
  list: {
    width: '100%'
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32
  },
  listHeader: {
    marginBottom: 20
  },
  headerAccent: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#29E58D',
    marginBottom: 14
  },
  title: {
    color: '#17384D',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0.2
  },
  subtitle: {
    color: '#6E8492',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6
  }
});
export default styles;