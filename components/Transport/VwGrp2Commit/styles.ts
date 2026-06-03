import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 50,
  },

  card: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },

  prodName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },

  prodInfo: {
    fontSize: 16,
    marginBottom: 4,
  },

  label: {
    fontWeight: 'bold',
  },

  prodDesc: {
    fontSize: 16,
    marginTop: 10,
    color: '#666',
  },

  buttonRow: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 10,
  },

  loanFriendButton: {
    backgroundColor: '#FFA500',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
  },

  redeemButton: {
    backgroundColor: '#00BFFF',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
  },

  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 20,
  },

  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },

  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#222',
    marginBottom: 6,
  },

  modalSubtitle: {
    fontSize: 14,
    color: '#444',
    marginBottom: 10,
  },

  modalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    fontWeight: 'bold',
    color: '#222',
  },

  modalHint: {
    fontSize: 12,
    color: '#666',
    marginBottom: 14,
  },

  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
  },

  modalCancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },

  modalCancelText: {
    color: '#e58d29',
    fontWeight: '700',
  },

  modalConfirmButton: {
    backgroundColor: '#e58d29',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },

  modalConfirmText: {
    color: '#fff',
    fontWeight: '700',
  },
});

export default styles;
