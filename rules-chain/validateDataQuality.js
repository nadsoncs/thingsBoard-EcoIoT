// Recupera as variáveis do payload da mensagem
var pH = msg.ph;
var tds = msg.tds;
var temperature = msg.temperature;

// Cria uma flag para identificar se algo está fora do padrão
var isSuspect = false;

if (pH !== undefined && (pH < 0 || pH > 14)) {
    isSuspect = true;
}

if (tds !== undefined && tds <= 0) {
    isSuspect = true;
}

if (temperature !== undefined && (temperature < 15 || temperature > 40)) {
    isSuspect = true;
}

// Se qualquer parâmetro falhar, adicionamos a marcação de qualidade
if (isSuspect) {
    msg.data_quality = "suspect";
} else {
    msg.data_quality = "valid";
}

// Retorna a mensagem modificada e o tipo da relação (Success)
return {msg: msg, metadata: metadata, msgType: msgType};