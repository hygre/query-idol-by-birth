const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const tunnel = require('tunnel');

axios.defaults.proxy = false;
axios.defaults.httpsAgent = tunnel.httpsOverHttp({proxy: {host: '127.0.0.1', port: 1080}}); //设置代理

let wikiUrl = 'https://ja.wikipedia.org';
let idolNameArr = [];
let page = 1;
let idolSum = 0;

async function start(url, year) {
    //GET漂亮姐姐列表页
    await axios
        .get(url)
        .then(idolListRes => {
            const idolListCheerio = cheerio.load(idolListRes.data); //将漂亮姐姐列表页加载到cheerio
            let counter = 0;    //已遍历元素计数器
            idolListCheerio('.mw-category-group').last().find('a').each(async function () {
                //GET漂亮姐姐的信息页
                await axios
                    .get(wikiUrl + idolListCheerio(this).attr('href'))   //漂亮姐姐对应的Wiki信息
                    .then(idolInfoRes => {
                        counter++;
                        const idolInfoCheerio = cheerio.load(idolInfoRes.data);  //将漂亮姐姐信息页面加载到cheerio
                        const idolName = idolListCheerio(this).attr('title').toString(); //漂亮姐姐的名字
                        const birthYear = parseInt(idolInfoCheerio('[title="誕生日"]').parent().next().text().toString().substr(1, 4));   //漂亮姐姐的诞生日
                        const elementTotal = idolListCheerio('.mw-category-group').last().find('a').length; //元素总数
                        const nextPage = idolListCheerio("a:contains(次のページ)").attr('href');   //获取下一页

                        if (birthYear >= year) idolNameArr.push(birthYear + '-----' + idolName);  //把符合条件的漂亮姐姐收起来
                        console.log(counter + '/' + idolListCheerio('.mw-category-group').last().find('a').length);
                        if (counter === elementTotal) { //判断当前页面是否已完成
                            console.log(idolNameArr.sort());
                            console.log(`已爬取第 ${page} 页`);
                            page++;
                            idolSum += counter;
                            console.log(`共爬取 ${idolSum} 位漂亮姐姐，符合条件的有 ${idolNameArr.length} 位`)
                            if (nextPage !== undefined) {
                                start(wikiUrl + nextPage, year);
                            } else {
                                let file = fs.createWriteStream('array.txt');
                                file.on('error', function (err) {
                                    console.log(err)
                                });
                                idolNameArr.forEach(function (v) {
                                    file.write(v + '\n');
                                });
                                file.end();
                            }
                        }
                    }).catch(e => console.log(e));
            });
        });
}

//输入
start(wikiUrl + '/wiki/Category:%E6%97%A5%E6%9C%AC%E3%81%AEAV%E5%A5%B3%E5%84%AA', 1995).then();