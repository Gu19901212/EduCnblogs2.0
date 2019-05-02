import PushUtil from './PushUtil'

import md5, { hex_md5 } from "react-native-md5";
import {requireTime} from '../request/requireTime';
import * as Service from '../request/request.js';

//umeng相关参数，详见文档
export const umengConfig = {
    urlHead:'http://msg.umeng.com/api/',
	appkey:'5cb692ac570df31b8d000cd7',
	appMasterSecret:'0qvlibhfma68xe5xe9untjujsilwlf14',
	messageType:{
		unicast:'unicast',
		listcast:'listcast',
		filecast:'filecast',
		broadcast:'broadcast',
		groupcast:'groupcast',
		customizedcast:'customizedcast',
	},
	displayType:{
		notification:'notification',
		message:'message',
	},
	requireType:{
		send:'send',
		getStatus:'status',
		cancel:'cancel',
		uploadFile:'upload',
    },
    
}
/*关于url的函数
format: pushUrl + pushType + ?sign=mysign
*/
/*
该函数用于:计算签名并得到最后的请求url
关于签名：
    为了确保用户发送的请求不被更改，我们设计了签名算法。该算法基本可以保证请求是合法者发送且参数没有被修改，但无法保证不被偷窥。 签名生成规则：

    - 提取请求方法method（POST，全大写）；
    - 提取请求url信息，包括Host字段的域名(或ip:端口)和URI的path部分。注意不包括path的querystring。比如http://msg.umeng.com/api/send 或者 http://msg.umeng.com/api/status;
    - 提取请求的post-body；
    - 拼接请求方法、url、post-body及应用的app_master_secret；
    - 将D形成字符串计算MD5值，形成一个32位的十六进制（字母小写）字符串，即为本次请求sign（签名）的值；sign=MD5($http_method$url$post-body$app_master_secret);

*/
//输入：请求的类型(消息发送,状态查询,消息取消,文件上传),请求体(json格式传入)
function getUrl(type, postBody){
    let appMasterSecret=umengConfig.appMasterSecret;
    const method = 'POST';
    let url = umengConfig.urlHead + type;
    //md5加密
    console.log(postBody);
    let rawString = encodeURI(method + url + JSON.stringify(postBody) + appMasterSecret);
    let sign = hex_md5(rawString);
    
    return (url + '?sign=' + sign);
}

//获取deviceToken，可能仅当pushAgent注册后才能成功获取
// function getDeviceToken(){
//     let ret = PushUtil.getDeviceToken((deviceToken)=>{
//         console.log(deviceToken);
//         return deviceToken;
//     });
//     return ret;
// }


export function sendUnicast(params){
    //单播通知请求函数
    /*
    输入：
    params : 参数，json格式
        ticker:必填，通知栏提示文字
        title:必填，通知标题
        text:必填，通知文字描述
    输出：成功返回消息id;失败返回错误码。
    */
    let appkey = umengConfig.appkey;
    let type = umengConfig.messageType.unicast;
    // let deviceToken = getDeviceToken();

    let displayType = umengConfig.displayType.notification;
    let body = {
        "ticker":params.ticker,
        "title":params.title,
        "text":params.text
    };
    let payload = {
        "display_type":displayType,
        "body":body,
    }
    PushUtil.getDeviceToken((deviceToken)=>{
        requireTime().then((result)=>{
            let timestamp = (result == -1 ? (new Date()).getTime() : result) +"";
            let postBody = {
                "appkey":appkey,
                "timestamp":timestamp,
                "type":type,
                "production_mode":"false",
                "device_tokens":deviceToken,
                "payload":payload,
                "description":"单播"
            }
            let url = getUrl(umengConfig.requireType.send,postBody);
            Service.RawUserAction(url,JSON.stringify(postBody),'POST').then((result)=>{
                result.json().then((jsonData)=>{
                    if(result.ret == "SUCCESS"){
                        return jsonData.data.msg_id;
                    }
                    else{
                        console.log(jsonData.data.error_msg);
                        return jsonData.data.error_code;
                    }
                }) 
            }).catch((err)=>{
                console.log(err);
                return -1;
            })
        });
    });
}

/*
关于tag的函数
*/

//为该设备添加一个tag，变量tag为字符串
//若成功则返回0，若失败返回状态码
export function addTag(tag){
    PushUtil.addTag(tag,(code,remain) =>{
        if(code == 200){
            return 0;
        }else{ 
            console.log(remain);
            return code;
        }
    });
}

//为该设备删除一个tag，变量tag为字符串
//若成功则返回0，若失败返回状态码
export function deleteTag(tag){
    PushUtil.deleteTag(tag,(code,remain) =>{
        if(code == 200){
            return 0;
        }else{ 
            console.log(remain);
            return code;
        }
    });
}

//展示该设备绑定的所有tag
//若成功则返回一个包含所有tag的数组,若失败则返回状态码
export function listTag(){
    PushUtil.listTag((code,result) =>{
        if(code == 200){
            return result;
        }
        else return code;
    })
}


export function testPush(){
    sendUnicast({ticker:"ticker",title:"title",text:"text"});``
}