import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#EAF7FC'
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 32
  },
  header: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    padding: 20,
    marginBottom: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D5EDF7',
    shadowColor: '#25677F',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3
  },
  accent: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#87CEEB',
    marginBottom: 14
  },
  title: {
    color: '#164458',
    fontSize: 24,
    fontWeight: '800'
  },
  subtitle: {
    color: '#64808A',
    fontSize: 14,
    marginTop: 6
  },
  count: {
    alignSelf: 'flex-start',
    color: '#126782',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#E5F6FC'
  },
  emptyState: {
    flex: 1,
    minHeight: 180,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24
  },
  emptyTitle: {
    color: '#164458',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center'
  },
  emptyText: {
    color: '#64808A',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10
  }
});

export default styles;
