#!/usr/bin/env node
var program = require('commander');
var request = require('request');
var PO = require('pofile');

var lang = "en-US";
var text = "\n";

function checkFile(file) {
  PO.load(file, function (err, po) {
    if (err) {
      console.log("Error on loading po file:");
      console.log(err);

      return err;
    }

    var i, j;

    for (i = 0; i < po.items.length; i++) {
      if (po.items[i].msgstr) {
        for (j = 0; j < po.items[i].msgstr.length; j++) {
          if (po.items[i].msgstr[j]) {
            text += "* "+po.items[i].msgstr[j]+"\n";
          }
        }
      }
    }

    request.post({
      url:'https://languagetool.org/api/v2/check',
      form: {
        text: text,
        language: lang
      },
      json: true
    },
    function(err, res, body){
      if (err) {
        console.log("Error on requesting to languagetool:");
        console.log(err);

        return err;
      }

      var words, i, j;

      for (i = 0; i < body.matches.length; i++) {
        console.log("#"+(i+1)+": "+body.matches[i].message);
        words = "";
        j = body.matches[i].offset-1;
        while (j >= 0 && (text[j] != " " && text[j-1] != "*" && text[j-2] != "\n")) {
          words = text[j] + words;
          j--;
        }
        words += "{";
        for (j = body.matches[i].offset; j <= body.matches[i].offset+body.matches[i].length-1; j++) {
          words += text[j];
        }
        words += "}";
        j = body.matches[i].offset+body.matches[i].length;
        while (j <= text.length && text[j] != "\n") {
          words += text[j];
          j++;
        }
        console.log(words+"\n");
      }
    });
  });
}

program
 .arguments('<file>')
 .option('-l, --language <language>', 'Language', function (language) {
  lang = language;
 })
 .action(checkFile)
 .parse(process.argv);
