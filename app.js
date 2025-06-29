const TMDB_API_KEY = "798473183e15fadd6e6f55ba3365c405";
const GENRE_MAP = {
  scifi: 878,
  comedy: 35,
  drama: 18,
  action: 28,
  horror: 27,
  romance: 10749,
  any: null,
};

function getTmdbGenreId(genre) {
  return GENRE_MAP[genre] || null;
}

function showPage(pageId) {
  document.querySelectorAll(".page-container").forEach((page) =>
    page.classList.remove("active")
  );
  const target = document.getElementById(pageId + "-page");
  if (target) target.classList.add("active");
  if (pageId === "dashboard") showDashboardRecommendations();
  if (pageId === "saved") showSavedList();
  if (pageId === "home") loadTrendingCarousel();
  if (pageId === "quiz") {
    quizManager = new QuizManager();
    quizManager.showQuestion(0);
  }
}

// Trending Carousel
let currentTrendingIndex = 0;
let trendingMovies = [];

async function loadTrendingCarousel() {
  const url = `https://api.themoviedb.org/3/trending/all/week?api_key=${TMDB_API_KEY}&language=en-US`;
  const carouselContainer = document.getElementById("trendingCarouselContainer");
  const carouselInner = document.getElementById("trendingCarouselInner");
  if (!carouselInner) return;
  carouselInner.innerHTML = `
    <div class="trending-slide active">
      <div class="d-flex justify-content-center align-items-center" style="height:300px;">
        <div class="spinner-border text-secondary"></div>
      </div>
    </div>
  `;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!data.results || !data.results.length) throw new Error("No trending content found");
    trendingMovies = data.results.slice(0, 8);
    currentTrendingIndex = 0;
    carouselInner.innerHTML = "";
    trendingMovies.forEach((item, index) => {
      const title = item.title || item.name || "";
      const poster = item.poster_path
        ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
        : "https://via.placeholder.com/240x360?text=No+Image";
      const overview = item.overview
        ? item.overview.substring(0, 120) + "..."
        : "No description available.";
      const type = item.media_type === "movie" ? "movie" : "tv";
      const slideHtml = `
        <div class="trending-slide ${index === 0 ? 'active' : ''}">
          <div class="row align-items-center justify-content-center g-0">
            <div class="col-12 col-md-4 text-center mb-3 mb-md-0">
              <img src="${poster}" class="trending-poster" alt="${title}" style="max-width: 200px; height: auto; border-radius: 8px;">
            </div>
            <div class="col-12 col-md-8">
              <div class="trending-content text-md-start p-3">
                <h5 class="mb-3">${title}</h5>
                <p class="mb-3">${overview}</p>
                <span class="badge bg-primary mb-2">${item.media_type === "movie" ? "Movie" : "Series"}</span>
                <br>
                <button class="btn btn-outline-light btn-sm show-modal-btn" data-id="${item.id}" data-type="${type}">
                  More Details →
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
      carouselInner.innerHTML += slideHtml;
    });
    setupTrendingNavigation();
    setTimeout(() => {
      document.querySelectorAll(".show-modal-btn").forEach(btn => {
        btn.addEventListener("click", function (e) {
          e.preventDefault();
          showMovieModal(this.dataset.id, this.dataset.type);
        });
      });
    }, 100);
  } catch (error) {
    carouselInner.innerHTML = `
      <div class="trending-slide active">
        <div class="d-flex justify-content-center align-items-center" style="height:240px;">
          <span class="text-danger">Couldn't load trending content. Please try again later.</span>
        </div>
      </div>
    `;
  }
}
function setupTrendingNavigation() {
  const existingNav = document.querySelector('.trending-navigation');
  if (existingNav) existingNav.remove();
  const carouselContainer = document.getElementById("trendingCarouselContainer") ||
    document.getElementById("trendingCarouselInner").parentElement;
  if (!carouselContainer) return;
  const navigationHtml = `
    <div class="trending-navigation">
      <button class="trending-nav-btn trending-prev" onclick="previousTrendingSlide()">
        <i class="fas fa-chevron-left"></i>
      </button>
      <button class="trending-nav-btn trending-next" onclick="nextTrendingSlide()">
        <i class="fas fa-chevron-right"></i>
      </button>
      <div class="trending-indicators">
        ${trendingMovies.map((_, index) =>
          `<span class="trending-indicator ${index === 0 ? 'active' : ''}" onclick="goToTrendingSlide(${index})"></span>`
        ).join('')}
      </div>
    </div>
  `;
  carouselContainer.insertAdjacentHTML('beforeend', navigationHtml);
}
function nextTrendingSlide() {
  if (currentTrendingIndex < trendingMovies.length - 1) {
    currentTrendingIndex++;
    updateTrendingSlide();
  }
}
function previousTrendingSlide() {
  if (currentTrendingIndex > 0) {
    currentTrendingIndex--;
    updateTrendingSlide();
  }
}
function goToTrendingSlide(index) {
  if (index >= 0 && index < trendingMovies.length) {
    currentTrendingIndex = index;
    updateTrendingSlide();
  }
}
function updateTrendingSlide() {
  document.querySelectorAll('.trending-slide').forEach(slide => {
    slide.classList.remove('active');
  });
  const slides = document.querySelectorAll('.trending-slide');
  if (slides[currentTrendingIndex]) {
    slides[currentTrendingIndex].classList.add('active');
  }
  document.querySelectorAll('.trending-indicator').forEach((indicator, index) => {
    indicator.classList.toggle('active', index === currentTrendingIndex);
  });
  const prevBtn = document.querySelector('.trending-prev');
  const nextBtn = document.querySelector('.trending-next');
  if (prevBtn) prevBtn.disabled = currentTrendingIndex === 0;
  if (nextBtn) nextBtn.disabled = currentTrendingIndex === trendingMovies.length - 1;
}
let trendingAutoAdvance;
function startTrendingAutoAdvance() {
  clearInterval(trendingAutoAdvance);
  trendingAutoAdvance = setInterval(() => {
    if (currentTrendingIndex < trendingMovies.length - 1) {
      nextTrendingSlide();
    } else {
      currentTrendingIndex = 0;
      updateTrendingSlide();
    }
  }, 5000);
}
function stopTrendingAutoAdvance() {
  clearInterval(trendingAutoAdvance);
}

// --- Modal, Recommendations, Quiz, Saved List ---

async function showMovieModal(id, type) {
  const modalLabel = document.getElementById("movieModalLabel");
  const modalBody = document.getElementById("movieModalBody");
  modalLabel.textContent = "Loading...";
  modalBody.innerHTML = `<div class="text-center my-3"><div class="spinner-border"></div></div>`;
  try {
    let detailsUrl = `https://api.themoviedb.org/3/${type}/${id}?api_key=${TMDB_API_KEY}&language=en-US`;
    let providersUrl = `https://api.themoviedb.org/3/${type}/${id}/watch/providers?api_key=${TMDB_API_KEY}`;
    const [detailsRes, providersRes] = await Promise.all([
      fetch(detailsUrl), fetch(providersUrl)
    ]);
    const details = await detailsRes.json();
    const providers = (await providersRes.json()).results?.US || {};
    modalLabel.textContent = details.title || details.name || "Details";
    let poster = details.poster_path
      ? `https://image.tmdb.org/t/p/w300${details.poster_path}`
      : "https://via.placeholder.com/300x450?text=No+Image";
    let genres = (details.genres || []).map(g => g.name).join(", ");
    let overview = details.overview || "";
    let release = details.release_date || details.first_air_date || "";
    let runtime = details.runtime
      ? `${details.runtime} min`
      : details.episode_run_time
      ? `${details.episode_run_time[0]} min/ep`
      : "";
    let provHtml = "";
    if (providers.flatrate && providers.flatrate.length) {
      provHtml += '<div class="providers-list mb-2"><b>Streaming on:</b> ';
      providers.flatrate.forEach(p => {
        provHtml += `<a href="${providers.link}" target="_blank"><img src="https://image.tmdb.org/t/p/w45${p.logo_path}" alt="${p.provider_name}" title="${p.provider_name}"></a>`;
      });
      provHtml += "</div>";
    }
    if (providers.buy && providers.buy.length) {
      provHtml += '<div class="providers-list mb-2"><b>Buy on:</b> ';
      providers.buy.forEach(p => {
        provHtml += `<a href="${providers.link}" target="_blank"><img src="https://image.tmdb.org/t/p/w45${p.logo_path}" alt="${p.provider_name}" title="${p.provider_name}"></a>`;
      });
      provHtml += "</div>";
    }
    if (!provHtml) {
      provHtml = '<div class="text-muted mb-2">No streaming info found for US region.</div>';
    }
    modalBody.innerHTML = `
      <div class="container-fluid">
        <div class="row">
          <div class="col-12 col-md-4 text-center mb-3 mb-md-0">
            <img src="${poster}" alt="${details.title || details.name}" class="img-fluid rounded" style="max-width:100%;height:auto;">
          </div>
          <div class="col-12 col-md-8">
            <div>
              <b>Genres:</b> ${genres}<br>
              <b>Release:</b> ${release}<br>
              <b>Runtime:</b> ${runtime}<br>
              <p class="mt-3">${overview}</p>
              ${provHtml}
              <a href="https://www.themoviedb.org/${type}/${id}" target="_blank" class="btn btn-outline-primary btn-sm mt-2">View on TMDb</a>
            </div>
          </div>
        </div>
      </div>
    `;
    const movieModalEl = document.getElementById("movieModal");
    const movieModal = bootstrap.Modal.getOrCreateInstance(movieModalEl);
    movieModal.show();
  } catch {
    modalLabel.textContent = "Details Unavailable";
    modalBody.innerHTML = `<div class="text-danger">Could not load details. Try again later.</div>`;
    const movieModalEl = document.getElementById("movieModal");
    const movieModal = bootstrap.Modal.getOrCreateInstance(movieModalEl);
    movieModal.show();
  }
}

// --- HERO "MORE INFO" POPUP MODAL ---
document.addEventListener("DOMContentLoaded", function () {
  const heroMore = document.getElementById("seeMoreHero");
  if (heroMore) {
    heroMore.addEventListener("click", function(e) {
      e.preventDefault();
      document.getElementById("movieModalLabel").textContent = "Superman";
      document.getElementById("movieModalBody").innerHTML = `
        <div class="container-fluid">
          <div class="row">
            <div class="col-12 col-md-4 text-center mb-3 mb-md-0">
              <img src="assets/hero_cinema.png" alt="Superman Poster" class="img-fluid rounded" style="max-width:100%;height:auto;">
            </div>
            <div class="col-12 col-md-8">
              <div>
                <b>Genres:</b> Action, Adventure, Fantasy<br>
                <b>Release:</b> 1978-12-15<br>
                <b>Runtime:</b> 143 min<br>
                <p class="mt-3">Superman, a journalist in Metropolis, embarks on a journey to reconcile his Kryptonian heritage with his human upbringing. As he discovers his true powers, he must defend Earth against unimaginable threats while coming to terms with his dual identity.</p>
                <span class="badge bg-primary">Movie</span>
                <a href="https://www.themoviedb.org/movie/1924-superman" target="_blank" class="btn btn-outline-primary btn-sm mt-2">View on TMDb</a>
              </div>
            </div>
          </div>
        </div>
      `;
      const movieModalEl = document.getElementById("movieModal");
      const movieModal = bootstrap.Modal.getOrCreateInstance(movieModalEl);
      movieModal.show();
    });
  }
});

function getSavedList() {
  return JSON.parse(localStorage.getItem("savedList") || "[]");
}
function isSaved(id) {
  return getSavedList().some(item => item.id == id);
}
function toggleSaveItem(id, title, poster, type) {
  let saved = getSavedList();
  if (saved.some(i => i.id == id)) {
    saved = saved.filter(i => i.id != id);
  } else {
    saved.push({ id, title, poster, type });
  }
  localStorage.setItem("savedList", JSON.stringify(saved));
  showDashboardRecommendations(false);
}
function createRecommendationCard(item) {
  const title = item.title || item.name || "";
  const overview = item.overview
    ? item.overview.substring(0, 120) + "..."
    : "";
  const poster = item.poster_path
    ? `https://image.tmdb.org/t/p/w300${item.poster_path}`
    : "https://via.placeholder.com/300x450?text=No+Image";
  const saved = isSaved(item.id) ? "saved" : "";
  const type = item.title ? "movie" : "tv";
  return `<div class="col-lg-4 col-md-6 mb-4">
      <div class="recommendation-card h-100 shadow" aria-label="${title}" data-id="${item.id}" data-type="${type}" tabindex="0">
        <img src="${poster}" class="recommendation-img" alt="${title}">
        <div class="recommendation-body">
          <div class="recommendation-title">${title}</div>
          <div class="recommendation-overview">${overview}</div>
          <div class="recommendation-footer">
            <span class="badge bg-primary">${item.title ? "Movie" : "Series"}</span>
            <button class="btn btn-save ${saved}" aria-label="Save" data-id="${item.id}" data-title="${title}" data-poster="${poster}" data-type="${type}" title="Save"><i class="fas fa-heart"></i></button>
          </div>
        </div>
      </div>
    </div>`;
}
function showSavedList() {
  const list = getSavedList();
  const cont = document.getElementById("savedList");
  const empty = document.getElementById("savedEmpty");
  if (!cont || !empty) return;
  if (!list.length) {
    cont.innerHTML = "";
    empty.style.display = "";
    return;
  }
  empty.style.display = "none";
  cont.innerHTML = list
    .map(item =>
      `<div class="col-md-4 mb-4">
        <div class="recommendation-card h-100 shadow" aria-label="${item.title}" data-id="${item.id}" data-type="${item.type}" tabindex="0">
          <img src="${item.poster}" class="recommendation-img" alt="${item.title}">
          <div class="recommendation-body">
            <div class="recommendation-title">${item.title}</div>
            <div class="recommendation-footer">
              <button class="btn btn-outline-danger btn-save remove-saved ms-auto mt-2" data-id="${item.id}" aria-label="Remove" title="Remove"><i class="fas fa-trash"></i></button>
            </div>
          </div>
        </div>
      </div>`
    ).join("");
  document.querySelectorAll(".remove-saved").forEach(btn => {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      let id = this.dataset.id;
      let saved = getSavedList().filter(i => i.id != id);
      localStorage.setItem("savedList", JSON.stringify(saved));
      showSavedList();
    });
  });
  document.querySelectorAll("#savedList .recommendation-card").forEach(card => {
    card.addEventListener("click", function () {
      showMovieModal(this.dataset.id, this.dataset.type);
    });
  });
}
async function fetchRecommendations(profile) {
  let type = profile.content === "movie" ? "movie" : "tv";
  if (profile.content === "both") type = Math.random() > 0.5 ? "movie" : "tv";
  let url = `https://api.themoviedb.org/3/discover/${type}?api_key=${TMDB_API_KEY}&language=en-US&sort_by=popularity.desc&vote_count.gte=100&with_original_language=en`;
  const genreId = getTmdbGenreId(profile.genre);
  if (genreId) url += `&with_genres=${genreId}`;
  if (type === "movie") {
    if (profile.length === "short") url += "&with_runtime.lte=90";
    else if (profile.length === "movie") url += "&with_runtime.gte=90&with_runtime.lte=140";
    else if (profile.length === "binge") url += "&with_runtime.gte=140";
  }
  if (type === "tv" && profile.seriesLength) {
    if (profile.seriesLength === "miniseries") url += "&with_number_of_episodes.lte=10";
    else if (profile.seriesLength === "long") url += "&with_number_of_seasons.gte=3";
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error("API Error");
  const data = await res.json();
  return (data.results || []).slice(0, 6);
}
async function showDashboardRecommendations(filtering = true) {
  const moodProfile = JSON.parse(localStorage.getItem("moodProfile") || "{}");
  let genreFilter = document.getElementById("dashboardGenreFilter")?.value;
  if (!genreFilter || !filtering) genreFilter = moodProfile.genre;
  document.getElementById("dashboardError").classList.add("d-none");
  const resultsCont = document.getElementById("recommendationResults");
  if (!resultsCont) return;
  resultsCont.innerHTML = `<div class="text-center my-3"><div class="spinner-border text-secondary"></div></div>`;
  try {
    let recs = await fetchRecommendations({ ...moodProfile, genre: genreFilter });
    if (!recs.length) throw new Error("No recommendations found. Try different quiz answers!");
    resultsCont.innerHTML = recs.map(item => createRecommendationCard(item)).join("");
    document.querySelectorAll(".btn-save").forEach(btn => {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        toggleSaveItem(this.dataset.id, this.dataset.title, this.dataset.poster, this.dataset.type);
      });
    });
    document.querySelectorAll(".recommendation-card").forEach(card => {
      card.addEventListener("click", function (e) {
        if (e.target.classList.contains("btn-save")) return;
        showMovieModal(this.dataset.id, this.dataset.type);
      });
    });
  } catch (e) {
    resultsCont.innerHTML = "";
    document.getElementById("dashboardError").textContent = e.message.includes("No recommendations")
      ? e.message
      : "Unable to load recommendations. Please try again later.";
    document.getElementById("dashboardError").classList.remove("d-none");
  }
}
function refreshDashboard() {
  showDashboardRecommendations(false);
}
document.addEventListener("DOMContentLoaded", () => {
  let genreFilter = document.getElementById("dashboardGenreFilter");
  if (genreFilter) {
    genreFilter.addEventListener("change", () => showDashboardRecommendations());
  }
});

// Quiz Logic
class QuizManager {
  constructor() {
    this.allQuestions = [
      "question1", "question2", "question3", "question4", "question5", "question6"
    ];
    this.currentQuestionIndex = 0;
    this.answers = {};
    this.seriesQuestionsEnabled = false;
    this.initializeQuiz();
  }
  initializeQuiz() {
    this.updateProgress();
    this.addOptionListeners();
    this.updateNavigationButtons();
    this.showOrHideSeriesQuestion();
  }
  addOptionListeners() {
    document.querySelectorAll(".option-card").forEach(card => {
      card.onclick = (e) => this.selectOption(e.currentTarget);
    });
  }
  selectOption(selectedCard) {
    const questionCard = selectedCard.closest(".question-card");
    const questionId = questionCard.id;
    questionCard.querySelectorAll(".option-card").forEach(card => {
      card.classList.remove("selected");
    });
    selectedCard.classList.add("selected");
    this.answers[questionId] = {
      value: selectedCard.dataset.value,
      mood: selectedCard.dataset.mood || null
    };
    if (questionId === "question3") {
      const val = selectedCard.dataset.value;
      this.seriesQuestionsEnabled = (val === "tv" || val === "both");
      this.showOrHideSeriesQuestion();
    }
    this.showNavigationButtons();
  }
  showOrHideSeriesQuestion() {
    const q6 = document.getElementById("question6");
    if (this.answers["question3"] && this.seriesQuestionsEnabled) {
      q6.style.display = "";
    } else {
      q6.style.display = "none";
      delete this.answers["question6"];
    }
  }
  showNavigationButtons() {
    const backBtn = document.getElementById("backBtn");
    const nextBtn = document.getElementById("nextBtn");
    const resultsBtn = document.getElementById("resultsBtn");
    backBtn.style.display = (this.currentQuestionIndex > 0) ? "inline-block" : "none";
    const currentQuestionId = this.getCurrentQuestionId();
    const answered = this.answers[currentQuestionId];
    if (answered) {
      if (this.isLastQuestion()) {
        nextBtn.style.display = "none";
        resultsBtn.style.display = "inline-block";
      } else {
        nextBtn.style.display = "inline-block";
        resultsBtn.style.display = "none";
      }
    } else {
      nextBtn.style.display = "none";
      resultsBtn.style.display = "none";
    }
  }
  updateProgress() {
    const progressFill = document.getElementById("progressFill");
    const progressText = document.getElementById("progressText");
    const total = this.getTotalQuestions();
    const pct = ((this.currentQuestionIndex + 1) / total) * 100;
    if (progressFill) progressFill.style.width = pct + "%";
    if (progressText) progressText.textContent = `Question ${this.currentQuestionIndex + 1} of ${total}`;
  }
  showQuestion(questionIndex) {
    document.querySelectorAll(".question-card").forEach(card => card.classList.remove("active"));
    const id = this.getQuestionIdByIndex(questionIndex);
    if (id) {
      document.getElementById(id).classList.add("active");
      this.currentQuestionIndex = questionIndex;
    }
    this.updateProgress();
    this.updateNavigationButtons();
  }
  updateNavigationButtons() { this.showNavigationButtons(); }
  getTotalQuestions() { return this.seriesQuestionsEnabled ? 6 : 5; }
  getCurrentQuestionId() { return this.getQuestionIdByIndex(this.currentQuestionIndex); }
  getQuestionIdByIndex(idx) {
    if (!this.seriesQuestionsEnabled && idx >= 5) return null;
    return this.allQuestions[idx];
  }
  isLastQuestion() {
    return (this.seriesQuestionsEnabled && this.currentQuestionIndex === 5)
      || (!this.seriesQuestionsEnabled && this.currentQuestionIndex === 4);
  }
  next() {
    let nextIdx = this.currentQuestionIndex + 1;
    if (!this.seriesQuestionsEnabled && nextIdx === 5) return;
    if (this.getQuestionIdByIndex(nextIdx)) {
      this.showQuestion(nextIdx);
    }
  }
  prev() {
    let prevIdx = this.currentQuestionIndex - 1;
    if (prevIdx >= 0) {
      this.showQuestion(prevIdx);
    }
  }
  getMoodProfile() {
    return {
      energy: this.answers.question1?.value || null,
      emotion: this.answers.question2?.value || null,
      content: this.answers.question3?.value || null,
      genre: this.answers.question4?.value || null,
      length: this.answers.question5?.value || null,
      seriesLength: this.seriesQuestionsEnabled ? (this.answers.question6?.value || null) : null
    };
  }
}
let quizManager = null;
function nextQuestion() { if (quizManager) { quizManager.next(); } }
function previousQuestion() { if (quizManager) { quizManager.prev(); } }
function showResults() {
  if (quizManager) {
    const moodProfile = quizManager.getMoodProfile();
    localStorage.setItem("moodProfile", JSON.stringify(moodProfile));
    showPage("dashboard");
  }
}

document.addEventListener("DOMContentLoaded", function () {
  showPage("home");
  loadTrendingCarousel();
  document.addEventListener('mouseenter', function(e) {
    if (e.target.closest('.trending-carousel-container')) {
      stopTrendingAutoAdvance();
    }
  });
  document.addEventListener('mouseleave', function(e) {
    if (e.target.closest('.trending-carousel-container')) {
      setTimeout(() => {
        startTrendingAutoAdvance();
      }, 1000);
    }
  });
});