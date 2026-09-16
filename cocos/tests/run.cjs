const fs=require('fs'),path=require('path'),child=require('child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'.test-build');
const creator=process.env.COCOS_CREATOR_EXE||'D:/CocosCreator/3.8.8/CocosCreator.exe'; const ts=require(path.join(path.dirname(creator),'resources/app.asar.unpacked/node_modules/typescript'));
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'package.json'),'{"type":"module"}');
for(const name of ['game','config']){const source=fs.readFileSync(path.join(root,'assets/scripts',name+'.ts'),'utf8').replace("from './config'","from './config.js'");fs.writeFileSync(path.join(out,name+'.js'),ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2021,module:ts.ModuleKind.ES2020}}).outputText);}
const test=fs.readFileSync(path.join(root,'tests/game.test.mjs'),'utf8').replaceAll("../game.js","./game.js").replaceAll("../config.js","./config.js");fs.writeFileSync(path.join(out,'game.test.mjs'),test);
const result=child.spawnSync(process.execPath,['--test',path.join(out,'game.test.mjs')],{stdio:'inherit'});process.exitCode=result.status;
