/* --------------------
  OPERAZIONI INIZIALI
---------------------- */

// Configurazione di ChatGPT
const API_BASE_URL = 'https://api.openai.com/v1';
const API_KEY = ''; // Inserisci qui la tua API_KEY
const GPT_MODEL = 'gpt-3.5-turbo';

// elementi principali della pagina------------------------------------------------------------

const loader = document.querySelector('.loader');
const genreButtons = document.querySelectorAll('.genre');
const placeholder = document.querySelector('#placeholder');
const stageTemplate = document.querySelector('#stage-template');
const gameoverTemplate = document.querySelector('#gameover-template');

//variabili-------------------------------------------------------------

//var per contenere chat
const completeChat = [];

//var per genere selezionato
let selectedGenre;


//logica del gioco----------------------------------------------------------

//selezione del genere tramite il rispettivo button
  //1.al click recuperare il genere selezionato
  //2. impostarlo come selectedGenre
  //3. avviare la partita

  
  genreButtons.forEach(function(button){
  //punto 1 e 2:
    button.addEventListener('click', function(){
      selectedGenre = button.dataset.genre;
  //punto 3:
      startGame();
    });
    
});

//funzioni----------------------------------------------------------------------
  //funzione per iniziare partita:

function startGame(){
  //1. inserire classe 'game-started'
  //2. preparazione istruzioni iniziali per chat GPT
  //3. avvio del primo livello

  //1:
  document.body.classList.add('game-started');
  //2:
  completeChat.push({
    role: `system`,
    content: `Voglio che ti comporti come se fossi un classico gioco di avventura testuale. Io sarò il protagonista e giocatore 
              principale. Non fare riferimento a te stesso. L\'ambientazione di questo gioco sarà a tema ${selectedGenre}. 
              Ogni ambientazione ha una descrizione di 150 caratteri seguita da una array di 3 azioni possibili che il giocatore può 
              compiere. Una di queste azioni è mortale e termina il gioco. Non aggiungere mai altre spiegazioni. Non fare riferimento 
              a te stesso. Le tue risposte sono solo in formato JSON come questo esempio:\n\n###\n\n{"description":"descrizione 
              ambientazione","actions":["azione 1", "azione 2", "azione 3"]}###`
  });
  //3:
  setStage();
}



//funzione per generare un livello:
async function setStage(){
  //1 svuotare il placeholder:
  placeholder.innerHTML = '';

  //2 mostare loader:
  loader.classList.remove('hidden');

  //3 chiedere a chatGPT di inventare il livello
  const gptResponse = await makeRequest('/chat/completions',{
    temperature: 0.7,
    model: GPT_MODEL,
    messages: completeChat
  });

  //4 nascondere il loader
  loader.classList.add('hidden');

  //5 prendere il messaggio di chatGPT e inserirlo nello storico della chat
  const message = gptResponse.choices[0].message;
  completeChat.push(message);

  //6 recuperare il contenuto del messaggio per estrapolare le azioni e la descrizione livello
  const content = JSON.parse(message.content);
  const actions = content.actions;
  const description = content.description;

  if(actions.length == 0){
    setGameOver(description);
  } else{

    //7 mostrare la descrizione del livello
    setStageDescription(description);
    
    //8 genriamo e mostriamo un'immagine per il livello
    await setStagePicture(description);
    
    //9 mostrare le azioni disponibili per livello
    setStageActions(actions);
  }
}





//funzione per descrizione livello
function setStageDescription(description){
  //1 clonare il template stage
  const stageElement = stageTemplate.content.cloneNode(true);
 //2 inserire la descrizione
 stageElement.querySelector('.stage-description').innerText = description;
 //3 visualizzare il template in pagina
 placeholder.appendChild(stageElement);
};




//funzione per immagine livello
async function setStagePicture(description){
  //1 chiedere a openAI di generare un img
  const generatedImage = await makeRequest('/images/generations', {
    n:1,
    size: '512x512',
    response_format: 'url',
    prompt:  `questa è una storia basata su ${selectedGenre}. ${description}`
  });
  //2 recuperare url img
  const imageUrl = generatedImage.data[0].url;
  //3 creare tag img
  const image = `<img src="${imageUrl}" alt="${description}">`;
  //4 inserirlo in pagina
  document.querySelector('.stage-picture').innerHTML = image;
};





//funzione per azioni livello
function setStageActions(actions){
  //1 costruire l'hml delle azioni
  let actionsHTML = '';
  actions.forEach(function(action){
    actionsHTML += `<button>${action}</button>`;
  });
  //2 montare azioni in pagina
  document.querySelector('.stage-actions').innerHTML = actionsHTML;
  //3 recuperare i buttons
  const actionButtons = document.querySelectorAll('.stage-actions button');
  //4 per ognuno di essi aggiungere un evento
  actionButtons.forEach(function(button){
    button.addEventListener('click', function(){
      //1 recuperare azione selezionata
      const selectedAction = button.innerText;
      //2 preparare messaggio per chatGPT
      completeChat.push({
        role: `user`,
        content:  `${selectedAction}. Se questa azione è mortale l'elenco delle azioni è vuoto. Non dare altro testo che non sia un 
        oggetto JSON. Le tue risposte sono solo in formato JSON come questo esempio:\n\n###\n\n{"description": "sei morto per questa 
        motivazione", "actions": []}###`
      });

      //3 richiedere la generazione di un nuovo livello
      setStage();

    });
  });
};





//funzione per gestire gameover
function setGameOver(description){
  //1 clonare template gameover
  const gameoverElement = gameoverTemplate.content.cloneNode(true);
  //2 inserire descrizione nel template
  gameoverElement.querySelector('.gameover-message').innerText = description;
  //3 inserire il template in pagina
  placeholder.appendChild(gameoverElement);
  //4 recuperare button replay
  const replayButton = documen.querySelector('.gameover button');
  //5 riavviare la partita ricaricando la pagina
  replayButton.addEventListener('click', function (){
    window.location.reload();
  });
}






//funzione per effetturare richieste 
async function makeRequest(endpoint, payload){
  const url = API_BASE_URL + endpoint;
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + API_KEY
    }
  })

  const jsonResponse = await response.json();
  return jsonResponse;
}