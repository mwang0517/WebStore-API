//扩展一些自己的接口---模块化
const fs = require('fs')                      //读取数据
const path = require('path')
const jsonServer = require('json-server');    //引入json-server
const jwt = require('jsonwebtoken');          //JWT注册获取JWT字符串
const server = jsonServer.create();           //创建server
const router = jsonServer.router(path.join(__dirname,'db.json'));  //把db.json的数据生成对应的路由（访问到products列表，carts列表）
const middleWares = jsonServer.defaults();    //中间件
server.use(jsonServer.bodyParser)             //设置解析器
server.use(middleWares); 
//-----------------------------------------------------------

//解析，从Json文件读取数据（绝对路径方式）
getUsersDb = () =>{
    return JSON.parse(fs.readFileSync(path.join(__dirname,'users.json'),'utf-8'))           
}

//拿到users数组，通过findIndex查找，若不等于-1则能够找到值
const isAuthenticated = ({email, password}) =>{
    return getUsersDb().users.findIndex(user=>user.email === email && user.password=== password) !== -1
}


//拿到users数组，判断是否有重复邮箱
const isExist = (email) =>{
  return getUsersDb().users.findIndex(user=>user.email === email) !== -1
}

//JWT注册，payload 是服务器端返回客户端的数据，secret是签名用的key(密钥), expiresIn是一些设置性的参数
const secret = '123TTALGJKLJLKJ1352'
const expiresIn = '1h'
const createToken = payload =>{
    return jwt.sign(payload,secret,{expiresIn})
}

//定义自己的登录接口
server.post('/auth/login',(req,res)=>{
    const{email,password} = req.body
    if(isAuthenticated({email, password})){
        //JWT认证注册，得到JWToken,通过json形式返回给客户端
        const user = getUsersDb().users.find(u=>u.email=== email && u.password===password)
        const {nickname, type} = user
        const jwToken = createToken({nickname,type,email})       //把nickname,email和type传递给payload
        return res.status(200).json(jwToken)
    }else{
        //认证不通过
        const status = 401
        const message = 'Incorrect email or password'
        return res.status(status).json({status,message})
    }
})

//定义自己的注册接口
// Register New User
server.post('/auth/register', (req, res) => {
    const { email, password, nickname, type } = req.body;
  
    // ----- 1 step
    if (isExist(email)) {
      const status = 401;
      const message = 'Email already exist';
      return res.status(status).json({ status, message });
    }
  
    // ----- 2 step
    fs.readFile(path.join(__dirname, 'users.json'), (err, _data) => {
      if (err) {
        const status = 401;
        const message = err;
        return res.status(status).json({ status, message });
      }
      // Get current users data
      const data = JSON.parse(_data.toString());
      // Get the id of last user
      const last_item_id = data.users[data.users.length - 1].id;
      //Add new user
      data.users.push({ id: last_item_id + 1, email, password, nickname, type }); //add some data
      fs.writeFile(
        path.join(__dirname, 'users.json'),
        JSON.stringify(data),
        (err, result) => {
          // WRITE
          if (err) {
            const status = 401;
            const message = err;
            res.status(status).json({ status, message });
            return;
          }
        }
      );
    });
  
    // Create token for new user
    const jwToken = createToken({ nickname, type, email });
    res.status(200).json(jwToken);
  });

//定义自己的接口
//判断当前请求访问的资源是否有JWT--有token
/**
request headers --> Authorization
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
.eyJuaWNrbmFtZSI6ImFkbWluIiwidHlwZSI6MSwiZW1haWwiOiJhZG1pbkAxNjMuY29tIiwiaWF0IjoxNTcyNzU3MjAzLCJleHAiOjE1NzI3NjA4MDN9
.f4hfN1IjU4E23Lo44N-2VLzc1qoyNu1oZg2iQreZTfU
*/

// server.use(/^(?!\/auth).*$/, (req, res, next) => {
// server.use(['/carts'], (req, res, next) => {
// server.use('/carts', (req, res, next) => {
//     //若没有JWToken
//     if(
//         req.headers.authorization === undefined ||
//         req.headers.authorization.split(' ')[0] !== 'Bearer'  //'Bearer'是JWT类型
//     ){
//         const status = 401;
//         const message = 'Error in authorization format';
//         res.status(status).json({ status, message });
//         return;
//     }
//     //若有JWToken
//     try {
//         const verifyTokenResult = verifyToken(
//           req.headers.authorization.split(' ')[1]     //拿到具体的JWToken
//         );
//         if (verifyTokenResult instanceof Error) {
//             const status = 401;
//             const message = 'Access token not provided';
//             res.status(status).json({ status, message });
//             return;
//         }
//         next();//继续处理原始carts请求，把carts相关资源返回给客户端
//     } catch (err) {
//         const status = 401;
//         const message = 'Error token is revoked';
//         res.status(status).json({ status, message });
//     }
//   });
// Verify the token
const verifyToken = token => {
    return jwt.verify(token, SECRET, (err, decode) =>
        decode !== undefined ? decode : err
    );
};
//-----------------------------------------------------------
server.use(router);
server.listen(3003,()=>{
    console.log('JSON server is running')              //监听端口号
});
