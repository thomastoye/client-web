const functions = require('firebase-functions')
const admin = require('firebase-admin')
try { admin.initializeApp() } catch (e) {}

exports=module.exports=functions.database.ref('/teamPayments/{user}/{chargeID}').onCreate((data,context)=>{
  const stripeObj = require('stripe')(functions.config().stripe.token);
  const val = data.val();
  if (val === null || val.id || val.error) return null;
  const amount = val.amountCharge;
  const currency = val.currency;
  const source = val.source;
  const idempotency_key = context.params.id;
  let charge = {amount, currency, source};
  return stripeObj.charges.create(charge, {idempotency_key})
  .then(response=>{
    return data.ref.child('response').set(response);
  }, error=>{
    data.ref.child('error').update({type: error.type});
    return data.ref.child('error').update({message: error.message});
  });
});
