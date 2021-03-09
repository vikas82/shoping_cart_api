var {cartController}= require('../controllers/cartController');

module.exports = function(app){
app.get('/',(req,res)=>{
    res.status(200).send('simple shopping cart project');
});

app.post('/readproductjson',cartController.readProductjson);
app.get('/listproduct',cartController.listProduct);
app.post('/addtocart',cartController.addtoCart);
app.get('/usercartlist',cartController.userCartlist);
app.get('/reportcartlist',cartController.reportCartlist);
app.delete('/removecartlist',cartController.removeCartlist);


}