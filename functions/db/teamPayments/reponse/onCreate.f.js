const functions = require('firebase-functions')
const admin = require('firebase-admin')
try { admin.initializeApp() } catch (e) {}

exports=module.exports=functions.database.ref('/teamPayments/{user}/{chargeID}/response/outcome').onCreate((data,context)=>{
  const val = data.val();
  if (val.seller_message=="Payment complete.") {
    return admin.database().ref('teamPayments/'+context.params.user+'/'+context.params.chargeID).once('value').then(payment=>{
      return createTransaction (payment.val().amountCOINSPurchased, "-KptHjRmuHZGsubRJTWJ", payment.val().team, "PERRINN", "Payment reference: "+context.params.chargeID).then((result)=>{
        if (result) {
          return admin.database().ref('teamPayments/'+context.params.user+'/'+context.params.chargeID+'/PERRINNTransaction').update({
            message: "COINS have been transfered to your team wallet."
          });
        }
      });
    });
  }
});
