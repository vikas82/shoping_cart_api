var fs = require("fs");
var db = require('../configs/connection');
const products = 'products.json';
const excel = require('exceljs');
var path = require('path');
var appRoot = path.resolve(__dirname);

var cartController = {};
cartController.readProductjson = async (req,res)=>{
    let productjson=   fs.readFileSync(products);
    let productjsonOut=JSON.parse(productjson);
    let a=Promise.all(productjsonOut.map(async (data,i)=>{

        let query = `select product_id from product_data where product_id='${data.productId}'`;
        let result= await db.sequelize.query(query, { type: db.Sequelize.QueryTypes.SELECT });
        if(result && result.length){
            let sql =`update into product_data set product_name='${data.productName}',sku_code='${data.skuCode}',price='${data.price}' where product_id='${data.productId}'`
            await db.sequelize.query(sql,[]);
        }else{
            let sql =`insert into product_data set product_id='${data.productId}',product_name='${data.productName}',sku_code='${data.skuCode}',price='${data.price}'`
            await db.sequelize.query(sql,[]);
            
            
        }
            //console.log(data);
            return data;
    }));
    res.status(200).send({message:'product Json Data added sucessfully',data:productjsonOut});
}


cartController.listProduct = async (req,res)=>{
    let page= req.query.page;
    const limit =2;
    let pageNumber = 1;

    if(page){
      pageNumber = page;
    }
    var start_from = (pageNumber-1)*limit;

    let query = `select * from product_data  limit ${start_from},${limit}`;
    let result= await db.sequelize.query(query, { type: db.Sequelize.QueryTypes.SELECT });
    return res.status(200).send({message:'Product List',data:result});
}

cartController.addtoCart = async (req,res)=>{
    try{
        let reqParms=req.body;
        console.log('reqParms=>',reqParms);
        let chkvalidateCart= await validateCart(reqParms.productId,reqParms.userId);

        if(!chkvalidateCart){
            return res.status(400).send({message:'Product Not Exist'}); 
        }

        let query = `select * from user_cart where product_id='${reqParms.productId}' and user_id='${reqParms.userId}'`;
        let result= await db.sequelize.query(query, { type: db.Sequelize.QueryTypes.SELECT });
            //if (err) throw err;
            reqParms.quantity=(reqParms.quantity)?reqParms.quantity:1;
            if(result && result.length){
                let quantity=result[0].quantity+parseInt(reqParms.quantity);

                let sql =`update  user_cart set quantity='${quantity}' where product_id='${reqParms.productId}' and user_id='${reqParms.userId}'`
                await db.sequelize.query(sql,[]);
            }else{
                let sql =`insert into user_cart set product_id='${reqParms.productId}',user_id='${reqParms.userId}',quantity='${reqParms.quantity}'`
            await db.sequelize.query(sql,[]);
            }
        
        console.log('result=>',result);
        return res.status(200).send({message:'Add Cart Sucessfully'});
    }catch(err){
        console.log('Error=>',err);
        return res.status(500).send({Error:err});
    }        
}



let validateCart = async (productId,userId) =>{
    let query = `select * from product_data  where product_id='${productId}'`;
    console.log('query=>',query);
    let result= await db.sequelize.query(query ,{ type: db.Sequelize.QueryTypes.SELECT });
    if(result && result.length){
    return true
    }
    return false;
    
}

cartController.userCartlist = async (req,res) =>{
    try{
        let reqParms = req.query;
        let query = `select pd.product_name,pd.sku_code,uc.quantity,pd.price,sum(pd.price*uc.quantity) Subtotal  
        from user_cart uc left join product_data pd on pd.product_id=uc.product_id 
        where  uc.user_id='${reqParms.userId}' group by pd.sku_code
        `;
        let result= await db.sequelize.query(query, { type: db.Sequelize.QueryTypes.SELECT });
        var grandTotal=0;
        let res1 =result.map((data,i)=>{
            grandTotal=grandTotal+parseFloat(data.Subtotal);
            
            return data;
        });
        
        return res.status(200).send({message:'List Cart Sucessfully',data:res1,grandTotal:grandTotal});
    }catch(err){
        console.log('Error=>',err);
        return res.status(500).send({Error:err});
    }
}

cartController.reportCartlist= async (req,res) =>{
  try{
    var  ctime=new Date().getTime();
    let gatePassWorkBook = new excel.Workbook();
    var filename="Report_sheet"+ ctime + ".xlsx";

    let query = `select pd.product_id,pd.product_name,pd.sku_code,count(distinct uc.user_id) total_user,sum(uc.quantity) total_quantity 
        from user_cart uc left join product_data pd on pd.product_id=uc.product_id 
        where   1 = 1 group by pd.sku_code
        `;
        let result= await db.sequelize.query(query, { type: db.Sequelize.QueryTypes.SELECT });
        
        let rportResult = await cartReportWorkSheet(result, gatePassWorkBook,ctime);
 console.log('rportResult=>',rportResult);
     
                  
 if(rportResult){
        await writeDataInFile(filename, { "name": gatePassWorkBook });
       }
        return res.status(200).send({message:'The report is successfully created',data:result});

  }catch(err){
        console.log('Error=>',err);
        return res.status(500).send({Error:err});
    } 
}

var writeDataInFile = async (fileName, sheetNameObject)=>{
    try {
        //let  reportCartList =  appRoot+'/reports/';
        let  reportCartList =  'reports/';
       console.log('reportCartList=>',reportCartList);
        if (!fs.existsSync(reportCartList)) {
            fs.mkdirSync(reportCartList);
            fs.chmodSync(reportCartList, 0777);
          }
        var filePath = reportCartList;
        filePath += fileName;
        console.log('filePath=>',filePath);
        let file = await sheetNameObject['name'].xlsx.writeFile(filePath);
            fs.chmodSync(filePath, 0755);
            console.log("The report is successfully created",file,reportCartList);
    }catch(err){
        console.log('Error=>',err);
    } 
}

var cartReportWorkSheet = async (reportArray, gatePassWorkBook,ctime=new Date().getTime()) => {
    return new Promise((resolve, reject) => {
        let columnHeader = [{ "header": "product_id", "key": "product_id" },
        { "header": "product_name", "key": "product_name" },
        { "header": "sku_code", "key": "sku_code"},
        { "header": "total_user", "key": "total_user"},
        { "header": "total_quantity", "key": "total_quantity"},
        
        ];
        
        let gatePassWorksheet;
        gatePassWorksheet = gatePassWorkBook.addWorksheet("Report_sheet"+ ctime, { 'state': 'visible' });
        gatePassWorksheet.columns = columnHeader;
        gatePassWorksheet.getRow("1").font = { "bold": true };
        reportArray.forEach(async function (item, index, array) {
             //console.log(item);
          
            gatePassWorksheet.addRow(item);
        });
        
        resolve(true);
    });
}


cartController.removeCartlist = async (req,res) =>{
    try{
        let reqParms = req.body;
        let query = `select * from user_cart where product_id='${reqParms.productId}' and user_id='${reqParms.userId}'`;
        let result= await db.sequelize.query(query, { type: db.Sequelize.QueryTypes.SELECT });
        if(result && result.length){
            let query = `delete from user_cart where product_id='${reqParms.productId}' and user_id='${reqParms.userId}'`;
            let result= await db.sequelize.query(query, []);
            return res.status(200).send({message:'product remove from cart sucessfully',data:result});
        }else{
            return res.status(400).send({message:'Product Not Exist in cart'}); 
        }



    }catch(err){
        console.log('Error=>',err);
        return res.status(500).send({Error:err});
    } 
}
exports.cartController = cartController;