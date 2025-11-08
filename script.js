// Variables globales
let current_id = 0;
let audioData = { audios: [] }; // Initialiser avec un tableau vide
let ambianceAudio = null;
let currentAudio = null;
let isFading = false;
let ambianceRunning = false;

// Configuration
const volume_low = 0.1;
const volume_high = 1;
const fadding = 3; // en secondes

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    // Récupération des données audio
    chargerDonneesAudio();
    
    // Initialisation des audios
    initAmbiance();
    setupKeyboardListeners();
    setupInputListener();
    displayKeyboardKeys();
    
    // Vérification de l'URL pour déclencher un son
    checkUrlParameter();
});

// Initialise l'audio d'ambiance
function initAmbiance() {
    ambianceAudio = new Audio('/ambiance/son.mp3');
    ambianceAudio.loop = true;
    ambianceAudio.volume = volume_high / 100;
    ambianceAudio.play().catch(e => console.log("Erreur lecture ambiance:", e));
}

// Configure les écouteurs d'événements clavier
function setupKeyboardListeners() {
    document.addEventListener('keydown', function(event) {
        const key = event.key.toLowerCase();
        
        // Vérifier si la touche correspond à un audio
        const audio = audioData.audios.find(a => a.keyboard_key === key);
        if (audio) {
            lire_son(audio.id);
        }
    });
}

// Configure l'écouteur pour le champ de saisie
function setupInputListener() {
    const input = document.getElementById('audio-code');
    input.addEventListener('change', function() {
        const id = parseInt(this.value);
        if (!isNaN(id)) {
            lire_son(id);
            this.value = ''; // Réinitialiser le champ
        }
    });
}

// Affiche les touches du clavier disponibles
function displayKeyboardKeys() {
    const container = document.getElementById('keyboard-keys');
    
    audioData.audios.forEach(audio => {
        const keyElement = document.createElement('div');
        keyElement.className = 'key';
        keyElement.textContent = audio.keyboard_key.toUpperCase();
        container.appendChild(keyElement);
    });
}

// Vérifie si un paramètre d'URL est présent pour déclencher un son
function checkUrlParameter() {
    const hash = window.location.hash.substring(1); // Retirer le #
    if (hash) {
        const audio = audioData.audios.find(a => a.url === hash);
        if (audio) {
            // Petit délai pour s'assurer que tout est chargé
            setTimeout(() => lire_son(audio.id), 500);
        }
    }
}

// Change le volume de l'ambiance progressivement
function volume_son_ambiance(targetVolume) {

    ambianceAudio.volume = targetVolume;
    return;
    if (!ambianceAudio || isFading) return;
    
    isFading = true;
    const startVolume = ambianceAudio.volume * 100;
    const volumeChange = targetVolume - startVolume;
    const stepDuration = 50; // ms
    const steps = (fadding * 1000) / stepDuration;
    const volumePerStep = volumeChange / steps;
    
    let currentStep = 0;
    
    const fadeInterval = setInterval(() => {
        currentStep++;
        const newVolume = (startVolume + (volumePerStep * currentStep)) / 100;
        ambianceAudio.volume = Math.max(0, Math.min(1, newVolume));
        
        if (currentStep >= steps) {
            clearInterval(fadeInterval);
            isFading = false;
        }
    }, stepDuration);
}

// Lit un son spécifique
function lire_son(id) {

    if (ambianceRunning===false) {
        initAmbiance();
        ambianceRunning = true;
    }

    // Si le même son est déjà en cours de lecture, on ne fait rien
    if (current_id === id) return;
    
    const audioInfo = audioData.audios.find(a => a.id === id);
    if (!audioInfo) {
        console.log("Audio non trouvé pour l'ID:", id);
        return;
    }
    
    // Si un son est déjà en cours, on l'arrête d'abord
    if (current_id !== 0) {
        stop_current();
    }
    
    // Baisser le volume de l'ambiance
    volume_son_ambiance(volume_low);
    
    // Mettre à jour l'ID courant
    current_id = id;
    
    // Créer et jouer le nouvel audio
    currentAudio = new Audio(audioInfo.path);
    currentAudio.volume = 1;
    
    // Afficher le lecteur audio
    const audioPlayer = document.getElementById('audio-player');
    audioPlayer.src = audioInfo.path;
    audioPlayer.style.display = 'block';
    
    // Afficher l'information de lecture
    document.getElementById('current-title').textContent = audioInfo.titre;
    document.getElementById('current-playing').classList.remove('hidden');
    
    // Configurer l'événement de fin
    currentAudio.addEventListener('ended', fin_son);
    audioPlayer.addEventListener('ended', fin_son);
    
    // Jouer l'audio
    currentAudio.play().catch(e => console.log("Erreur lecture audio:", e));
    audioPlayer.play().catch(e => console.log("Erreur lecture player:", e));
}

// Arrête le son en cours
function stop_current() {
    if (current_id === 0 || !currentAudio) return;
    
    // Arrêter l'audio courant
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio.removeEventListener('ended', fin_son);
    currentAudio = null;
    
    // Cacher l'affichage de lecture
    document.getElementById('current-playing').classList.add('hidden');
    
    // Réinitialiser l'ID courant
    current_id = 0;
}

// Gère la fin d'un son
function fin_son() {
    // Cacher l'affichage de lecture
    document.getElementById('current-playing').classList.add('hidden');
    
    // Réinitialiser l'ID courant
    current_id = 0;
    currentAudio = null;
    
    // Remonter le volume de l'ambiance
    volume_son_ambiance(volume_high);
}

// Charge les données audio depuis le fichier JSON
function chargerDonneesAudio() {
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            audioData = data;
            
            // Initialiser les composants après le chargement des données
            initAmbiance();
            setupKeyboardListeners();
            setupInputListener();
            displayKeyboardKeys();
            
            // Vérification de l'URL pour déclencher un son
            checkUrlParameter();
        })
        .catch(error => {
            console.error('Erreur lors du chargement des données audio:', error);
        });
}