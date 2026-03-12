import { StyleSheet, Dimensions } from 'react-native';
const styles = StyleSheet.create({
  // ...existing code...
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 28,
    width: '92%',
        marginBottom: 250,

    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    alignSelf: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f6fa',
  },
  image: {
    width: '100%',
    height: 670,
    resizeMode: 'cover',
    justifyContent: 'center'
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black'
  },
  loanTitleView: {
    backgroundColor: 'white',
    marginHorizontal: 10,
    width: Dimensions.get('screen').width - 20,
    height: 40,
    borderRadius: 5,
    marginTop: 30,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    top: 10
  },
  sendAmtViewDesc: {
    backgroundColor: 'skyblue',
    marginHorizontal: 10,
    width: Dimensions.get('screen').width - 20,
    height: "12%",
    borderRadius: 20,
    marginTop: "5%",
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    padding: "1%"
  },
  sendAmtInputDesc: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    width: Dimensions.get('screen').width - 30,
    height: "70%",
    borderRadius: 10,
    marginTop: "2%",
    justifyContent: 'center',
    alignItems: 'center'
  },
  sendLoanView: {
    backgroundColor: 'skyblue',
    marginHorizontal: 10,
    width: Dimensions.get('screen').width - 20,
    height: 90,
    borderRadius: 20,
    marginTop: 30,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    marginBottom: 20
  },
  sendLoanText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 30
  },
  sendLoanButton: {
    backgroundColor: '#fff',
    height: 45,
    borderRadius: 30,
    marginHorizontal: 10,
    width: Dimensions.get('screen').width - 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 400
  },
  sendLoanButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: 'black'
  },
  sendLoanInput: {
    backgroundColor: 'white',
    width: 300,
    height: 45,
    borderRadius: 10,
    marginTop: 15,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loanSpecificationsTextInput: {
    backgroundColor: 'white',
    width: 300,
    height: 200,
    borderRadius: 10,
    marginTop: 15,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loanSpecificationView: {
    backgroundColor: 'skyblue',
    marginHorizontal: 10,
    width: Dimensions.get('screen').width - 20,
    height: 250,
    borderRadius: 20,
    marginTop: 30,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    marginBottom: 20
  },
  root: {
    flex: 1,
    backgroundColor: '#f4f6fa',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2933',
    marginBottom: 12,
    textAlign: 'center',
  }
});
export default styles;