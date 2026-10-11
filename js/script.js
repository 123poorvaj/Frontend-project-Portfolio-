/* Portfolio interactions using the Apps Script endpoint from the supplied JS file.
   API contract retained: save_message {name,email,msg}, login {username,password},
   and GET response retrieval. */
(function () {
  "use strict";

  // Existing Google Apps Script Web App endpoint from your supplied script.js.
  const DB_url = "https://script.google.com/macros/s/AKfycbx1hEejai3jLYJT4lgPIBB6kydOcz8re2zvnUEOPY_GnorsLD5-4oOWMfvrFNqbnjpmVQ/exec";

  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));

  $("#current-year").textContent = new Date().getFullYear();

  // Theme toggle
  const themeToggle = $("#theme-toggle");
  const savedTheme = localStorage.getItem("pmg-theme");
  if (savedTheme === "light") document.body.classList.add("light-theme");
  updateThemeIcon();

  themeToggle.addEventListener("click", function () {
    document.body.classList.toggle("light-theme");
    localStorage.setItem("pmg-theme", document.body.classList.contains("light-theme") ? "light" : "dark");
    updateThemeIcon();
  });

  function updateThemeIcon() {
    const isLight = document.body.classList.contains("light-theme");
    themeToggle.innerHTML = isLight ? '<i class="fas fa-moon" aria-hidden="true"></i>' : '<i class="fas fa-sun" aria-hidden="true"></i>';
    themeToggle.setAttribute("aria-label", isLight ? "Switch to dark theme" : "Switch to light theme");
  }

  // Typing effect
  const typingTarget = $("#typing-text");
  const phrases = ["Frontend Development", "JavaScript", "AI-powered Applications", "Clean UI Design"];
  let phraseIndex = 0, characterIndex = 0, deleting = false;
  function typePhrase() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      typingTarget.textContent = phrases[0];
      return;
    }
    const phrase = phrases[phraseIndex];
    typingTarget.textContent = phrase.slice(0, characterIndex);
    if (!deleting && characterIndex < phrase.length) {
      characterIndex++;
      setTimeout(typePhrase, 75);
    } else if (!deleting) {
      deleting = true;
      setTimeout(typePhrase, 1200);
    } else if (characterIndex > 0) {
      characterIndex--;
      setTimeout(typePhrase, 35);
    } else {
      deleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      setTimeout(typePhrase, 250);
    }
  }
  typePhrase();

  // Reveal animations
  const revealItems = $$(".section-heading, .glass-card, .timeline-item");
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    revealItems.forEach(item => item.classList.add("reveal"));
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealItems.forEach(item => observer.observe(item));
  }

  // Close mobile navbar after a link is selected.
  $$(".navbar-nav .nav-link, .navbar-nav .nav-cta").forEach(link => {
    link.addEventListener("click", () => {
      if (window.innerWidth < 992 && $("#mainNav").classList.contains("show") && window.jQuery) {
        window.jQuery("#mainNav").collapse("hide");
      }
    });
  });

  // Active section highlighting
  const sectionLinks = $$(".navbar-nav a.nav-link[href^='#']");
  const sections = sectionLinks.map(link => $(link.getAttribute("href"))).filter(Boolean);
  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          sectionLinks.forEach(link => link.classList.toggle("active", link.getAttribute("href") === "#" + entry.target.id));
        }
      });
    }, { rootMargin: "-30% 0px -60% 0px" });
    sections.forEach(section => sectionObserver.observe(section));
  }

  // Contact form: uses the existing save_message action and name/email/msg keys.
  const contactForm = $("#contact-form");
  const contactStatus = $("#contact-status");
  const contactSubmit = $("#contact-submit");
  const contactSpinner = $("#contact-spinner");

  contactForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    contactStatus.textContent = "";
    contactStatus.className = "form-status mt-3";

    if (!contactForm.checkValidity()) {
      contactForm.reportValidity();
      return;
    }

    const name = $("#contact-name").value.trim();
    const email = $("#contact-email").value.trim();
    const subject = $("#contact-subject").value.trim();
    const message = $("#contact-message").value.trim();
    if (!name || !email || !subject || !message) {
      showStatus(contactStatus, "Please complete every field.", "error");
      return;
    }

    contactSubmit.disabled = true;
    contactSpinner.classList.remove("d-none");
    $(".submit-label", contactSubmit).textContent = "Sending...";

    try {
      const response = await fetch(DB_url, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "save_message",
          name: name,
          email: email,
          msg: "Subject: " + subject + "\n\n" + message
        })
      });
      const result = await response.json();
      if (!response.ok || result.success !== true) throw new Error(result.message || "Message could not be saved.");
      showStatus(contactStatus, "Thanks! Your message was submitted successfully.", "success");
      contactForm.reset();
    } catch (error) {
      console.error("Contact submission failed:", error);
      showStatus(contactStatus, "There was a problem submitting the message. Please try again.", "error");
    } finally {
      contactSubmit.disabled = false;
      contactSpinner.classList.add("d-none");
      $(".submit-label", contactSubmit).textContent = "Send Message";
    }
  });

  function showStatus(element, message, type) {
    element.textContent = message;
    element.className = "form-status mt-3 " + (type === "success" ? "success" : "error-text");
  }

  // Admin login. The API must verify credentials on the server.
  const adminBtn = $("#admin-btn");
  const adminLoginSection = $("#admin-login");
  const adminForm = $("#admin-from");
  const adminError = $("#login-error");
  const responsesSection = $("#user-responses");
  const responsesContainer = $("#respons-details");
  const totalResponses = $("#total-responses");
  const adminLogout = $("#admin-logout");

  // Admin project manager. Local browser storage is used because the current Apps Script
  // API contract does not expose a project-save action.
  const PROJECTS_STORAGE_KEY = "pmg-portfolio-projects-v1";
  const projectsGrid = $("#projects-grid");
  const addProjectForm = $("#add-project-form");
  const projectAdminStatus = $("#project-admin-status");
  const addedProjectsList = $("#added-projects-list");

  function readAddedProjects() {
    try {
      const parsed = JSON.parse(localStorage.getItem(PROJECTS_STORAGE_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn("Could not read saved projects:", error);
      return [];
    }
  }

  function safeExternalUrl(value) {
    const trimmed = (value || "").trim();
    if (!trimmed) return "";
    try {
      const url = new URL(trimmed);
      return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
    } catch (_) {
      return "";
    }
  }

  function createProjectCard(project, index) {
    const column = document.createElement("div");
    column.className = "col-lg-4 col-md-6 mb-4";
    const article = document.createElement("article");
    article.className = "glass-card project-card h-100";
    const art = document.createElement("div");
    art.className = "project-art art-portfolio";
    const icon = document.createElement("i");
    icon.className = "fas fa-laptop-code";
    icon.setAttribute("aria-hidden", "true");
    const category = document.createElement("span");
    category.textContent = project.category || "NEW PROJECT";
    art.append(icon, category);
    const body = document.createElement("div");
    body.className = "project-body";
    const meta = document.createElement("div");
    meta.className = "project-meta";
    meta.textContent = String(index + 4).padStart(2, "0") + " / ADDED PROJECT";
    const title = document.createElement("h3");
    title.textContent = project.title;
    const description = document.createElement("p");
    description.textContent = project.description;
    const tags = document.createElement("div");
    tags.className = "project-tags";
    (Array.isArray(project.technologies) ? project.technologies : []).forEach(technology => {
      const tag = document.createElement("span");
      tag.textContent = technology;
      tags.appendChild(tag);
    });
    const links = document.createElement("div");
    links.className = "project-links";
    const github = safeExternalUrl(project.github);
    const demo = safeExternalUrl(project.demo);
    if (github) {
      const link = document.createElement("a");
      link.href = github; link.target = "_blank"; link.rel = "noopener noreferrer";
      link.append(document.createTextNode("GitHub "));
      const linkIcon = document.createElement("i"); linkIcon.className = "fas fa-arrow-up-right-alt ml-1";
      linkIcon.setAttribute("aria-hidden", "true"); link.appendChild(linkIcon); links.appendChild(link);
    }
    if (demo) {
      const link = document.createElement("a");
      link.href = demo; link.target = "_blank"; link.rel = "noopener noreferrer";
      link.append(document.createTextNode("Live Demo "));
      const linkIcon = document.createElement("i"); linkIcon.className = "fas fa-arrow-up-right-alt ml-1";
      linkIcon.setAttribute("aria-hidden", "true"); link.appendChild(linkIcon); links.appendChild(link);
    }
    if (!github && !demo) {
      const link = document.createElement("a"); link.href = "#contact"; link.textContent = "Ask about it"; links.appendChild(link);
    }
    body.append(meta, title, description, tags, links);
    article.append(art, body); column.appendChild(article);
    return column;
  }

  function renderAddedProjects() {
    const projects = readAddedProjects();
    $$(".user-added-project", projectsGrid).forEach(card => card.remove());
    projects.forEach((project, index) => {
      const card = createProjectCard(project, index);
      card.classList.add("user-added-project");
      projectsGrid.appendChild(card);
    });

    addedProjectsList.replaceChildren();
    if (!projects.length) {
      const empty = document.createElement("p");
      empty.className = "muted mb-0";
      empty.textContent = "No projects added from the admin panel yet.";
      addedProjectsList.appendChild(empty);
      return;
    }
    projects.forEach(project => {
      const row = document.createElement("div");
      row.className = "added-project-row";
      const title = document.createElement("strong");
      title.textContent = project.title;
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "btn btn-sm btn-outline-danger";
      remove.textContent = "Remove";
      remove.setAttribute("aria-label", "Remove project " + project.title);
      remove.addEventListener("click", function () {
        const updated = readAddedProjects().filter(item => item.id !== project.id);
        localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(updated));
        renderAddedProjects();
        showStatus(projectAdminStatus, "Project removed from this browser.", "success");
      });
      row.append(title, remove);
      addedProjectsList.appendChild(row);
    });
  }

  renderAddedProjects();

  addProjectForm.addEventListener("submit", function (event) {
    event.preventDefault();
    projectAdminStatus.textContent = "";
    const title = $("#new-project-title").value.trim();
    const category = $("#new-project-category").value.trim();
    const description = $("#new-project-description").value.trim();
    const technologies = $("#new-project-tech").value.split(",").map(item => item.trim()).filter(Boolean).slice(0, 12);
    const githubInput = $("#new-project-github").value.trim();
    const demoInput = $("#new-project-demo").value.trim();
    const github = safeExternalUrl(githubInput);
    const demo = safeExternalUrl(demoInput);

    if (!title || !description || technologies.length === 0) {
      showStatus(projectAdminStatus, "Enter a title, description, and at least one technology.", "error");
      return;
    }
    if ((githubInput && !github) || (demoInput && !demo)) {
      showStatus(projectAdminStatus, "Project links must be valid HTTP or HTTPS URLs.", "error");
      return;
    }

    try {
      const projects = readAddedProjects();
      projects.push({
        id: "project-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
        title, category, description, technologies, github, demo
      });
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
      renderAddedProjects();
      addProjectForm.reset();
      showStatus(projectAdminStatus, "Project added! It is now visible in your Projects section in this browser.", "success");
    } catch (error) {
      console.error("Could not save project:", error);
      showStatus(projectAdminStatus, "Could not save this project. Check your browser storage settings.", "error");
    }
  });

  adminBtn.addEventListener("click", function () {
    const shouldOpen = adminLoginSection.hidden;
    adminLoginSection.hidden = !shouldOpen;
    if (shouldOpen) {
      responsesSection.hidden = true;
      adminLoginSection.scrollIntoView({ behavior: "smooth", block: "start" });
      $("#admin-name").focus({ preventScroll: true });
    }
  });

  $("#toggle-password").addEventListener("click", function () {
    const passwordInput = $("#admin-password");
    const show = passwordInput.type === "password";
    passwordInput.type = show ? "text" : "password";
    this.innerHTML = show ? '<i class="far fa-eye-slash" aria-hidden="true"></i>' : '<i class="far fa-eye" aria-hidden="true"></i>';
    this.setAttribute("aria-label", show ? "Hide password" : "Show password");
  });

  adminForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    adminError.textContent = "";
    const username = $("#admin-name").value.trim();
    const password = $("#admin-password").value;
    if (!username || !password) {
      adminError.textContent = "Enter both username and password.";
      return;
    }

    const submitButton = $("#admin-submit");
    submitButton.disabled = true;
    submitButton.textContent = "Signing in...";

    try {
      const response = await fetch(DB_url, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "login", username: username, password: password })
      });
      const result = await response.json();
      if (!response.ok || result.success !== true) throw new Error(result.message || "Access denied. Please check your credentials.");

      // Keep a session token only if the existing API provides one.
      if (result.token) sessionStorage.setItem("pmg-admin-token", result.token);
      adminLoginSection.hidden = true;
      responsesSection.hidden = false;
      responsesSection.scrollIntoView({ behavior: "smooth", block: "start" });
      await getUserMessages();
    } catch (error) {
      console.error("Admin login failed:", error);
      adminError.textContent = error.message || "There was a problem logging in.";
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Sign In";
    }
  });

  async function getUserMessages() {
    responsesContainer.replaceChildren();
    const loading = document.createElement("p");
    loading.className = "muted";
    loading.textContent = "Loading responses...";
    responsesContainer.appendChild(loading);
    totalResponses.textContent = "…";

    try {
      // Preserves the original script's GET retrieval pattern.
      const response = await fetch(DB_url);
      const result = await response.json();
      if (!response.ok || result.success !== true || !Array.isArray(result.messages)) {
        throw new Error(result.message || "Could not fetch the messages.");
      }

      responsesContainer.replaceChildren();
      totalResponses.textContent = String(result.messages.length);
      if (result.messages.length === 0) {
        const empty = document.createElement("p");
        empty.className = "muted";
        empty.textContent = "No contact messages yet.";
        responsesContainer.appendChild(empty);
        return;
      }

      result.messages.forEach(message => {
        const card = document.createElement("article");
        card.className = "glass-card response-card";
        const name = document.createElement("h3");
        name.textContent = "Name: " + (message.name || "Unnamed");
        const email = document.createElement("p");
        email.className = "response-email";
        email.textContent = "Email: " + (message.email || "Not provided");
        const body = document.createElement("p");
        body.className = "response-message";
        body.textContent = "Message: " + (message.msg || "");
        const date = document.createElement("p");
        date.className = "response-date";
        date.textContent = "Date: " + (message.date ? new Date(message.date).toLocaleString() : "Not available");
        card.append(name, email, body, date);
        responsesContainer.appendChild(card);
      });
    } catch (error) {
      console.error("Message retrieval failed:", error);
      responsesContainer.replaceChildren();
      const errorMessage = document.createElement("p");
      errorMessage.className = "form-status error-text";
      errorMessage.textContent = "There was a problem fetching messages from Google Sheets.";
      responsesContainer.appendChild(errorMessage);
      totalResponses.textContent = "0";
    }
  }

  adminLogout.addEventListener("click", function () {
    sessionStorage.removeItem("pmg-admin-token");
    responsesContainer.replaceChildren();
    totalResponses.textContent = "0";
    responsesSection.hidden = true;
    adminLoginSection.hidden = true;
    adminForm.reset();
    adminError.textContent = "";
    $("#home").scrollIntoView({ behavior: "smooth" });
  });
})();
