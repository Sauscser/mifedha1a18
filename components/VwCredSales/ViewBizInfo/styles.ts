import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  pageContainer: {
    width: '100%',
    paddingTop: 4,
    paddingBottom: 12
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2EDF2',
    borderWidth: 1,
    borderTopColor: '#29E58D',
    borderTopWidth: 4,
    borderRadius: 18,
    padding: 20,
    shadowColor: '#17384D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 18
  },

  headerAccent: {
    width: 4,
    borderRadius: 2,
    backgroundColor: '#87CEEB',
    marginRight: 14
  },

  cardHeading: {
    flex: 1
  },

  sectionTitle: {
    color: '#17384D',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12
  },

  businessLabel: {
    color: '#718693',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 3
  },

  businessName: {
    color: '#1E3A4D',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22
  },

  metrics: {
    gap: 10
  },

  metricCard: {
    backgroundColor: '#F1F9FC',
    borderColor: '#DCEEF5',
    borderWidth: 1,
    borderLeftColor: '#87CEEB',
    borderLeftWidth: 4,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 15
  },

  benefitsCard: {
    backgroundColor: '#F2FCF7',
    borderColor: '#DDF5E8',
    borderWidth: 1,
    borderLeftColor: '#29E58D',
    borderLeftWidth: 4,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 15
  },

  metricLabel: {
    color: '#718693',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 5
  },

  balanceAmount: {
    color: '#17384D',
    fontSize: 20,
    fontWeight: '700'
  },

  benefitsAmount: {
    color: '#167A51',
    fontSize: 20,
    fontWeight: '700'
  },

  descriptionSection: {
    borderTopColor: '#E8F0F3',
    borderTopWidth: 1,
    marginTop: 16,
    paddingTop: 14
  },

  description: {
    color: '#718693',
    fontSize: 14,
    lineHeight: 21
  },
});

export default styles;
