import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  pageContainer: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingVertical: 8
  },
  card: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D5EDF7',
    shadowColor: '#25677F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E4F1F6'
  },
  accent: {
    width: 5,
    height: 42,
    borderRadius: 3,
    backgroundColor: '#87CEEB',
    marginRight: 12
  },
  amount: {
    color: '#164458',
    fontSize: 24,
    fontWeight: '800'
  },
  currency: {
    color: '#64808A',
    fontSize: 13,
    marginLeft: 8,
    marginTop: 6
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF5F8'
  },
  lastDetail: {
    borderBottomWidth: 0,
    paddingBottom: 0
  },
  detailLabel: {
    flex: 1,
    color: '#64808A',
    fontSize: 13,
    marginRight: 12
  },
  detailValue: {
    flex: 1.4,
    color: '#244C5B',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right'
  }
});

export default styles;
