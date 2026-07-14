import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7'
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#fff'
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    marginRight: 8
  },
  backButtonText: {
    fontSize: 20,
    fontWeight: '700'
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222'
  },
  selectorWrap: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 4,
    backgroundColor: '#fff'
  },
  sectionLabel: {
    fontWeight: '600',
    color: '#444',
    marginBottom: 8
  },
  selectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  businessChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#eee',
    marginRight: 8,
    marginBottom: 8
  },
  businessChipSelected: {
    backgroundColor: '#e58d29'
  },
  businessChipText: {
    color: '#333',
    fontWeight: '600'
  },
  businessChipTextSelected: {
    color: '#fff'
  },
  filterWrap: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: '#fff'
  },
  filterInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    fontWeight: 'bold',
    color: '#222'
  },
  listContent: {
    padding: 12,
    paddingBottom: 24
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee'
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  cardTitle: {
    flex: 1,
    fontWeight: '700',
    color: '#222'
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#eaf4ff',
    color: '#1a73e8',
    fontWeight: '600',
    fontSize: 12
  },
  cardText: {
    color: '#555',
    marginBottom: 4
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10
  },
  secondaryButton: {
    flex: 1,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#eef6ff',
    paddingVertical: 10,
    alignItems: 'center'
  },
  secondaryButtonText: {
    color: '#1a73e8',
    fontWeight: '700'
  },
  dangerButton: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: '#ffeaea',
    paddingVertical: 10,
    alignItems: 'center'
  },
  dangerButtonText: {
    color: '#d93025',
    fontWeight: '700'
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyText: {
    color: '#666',
    textAlign: 'center'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    color: '#222'
  },
  transactionItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  transactionTitle: {
    fontWeight: '700',
    color: '#222',
    marginBottom: 2
  },
  primaryButton: {
    marginTop: 12,
    borderRadius: 8,
    backgroundColor: '#1a73e8',
    paddingVertical: 10,
    alignItems: 'center'
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700'
  }
});
