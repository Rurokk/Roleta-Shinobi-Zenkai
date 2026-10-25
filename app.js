
const SUPABASE_URL = "https://lmskxdlpannjnbdqveug.supabase.co/rest/v1/";
const SUPABASE_ANON_KEY = "sb_publishable_bOTpjvruQ9EHN0BecbLGoQ_F53oQdWg";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
    SUPABASE_ANON_KEY
    );

    const loginBtn = document.getElementById("loginBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const authMessage = document.getElementById("authMessage");
    const spinBtn = document.getElementById("spinBtn");
    const spinMessage = document.getElementById("spinMessage");
    const wheel = document.getElementById("wheel");
    const result = document.getElementById("result");
    const remaining = document.getElementById("remaining");
    const used = document.getElementById("used");
    const progressBar = document.getElementById("progressBar");
    const historyList = document.getElementById("historyList");

    let isSpinning = false;
    let rotation = 0;

    function setMessage(element, message) {
      element.textContent = message;
      }

      function showLoggedIn(isLoggedIn) {
        loginBtn.classList.toggle("hidden", isLoggedIn);
          logoutBtn.classList.toggle("hidden", !isLoggedIn);
            spinBtn.disabled = !isLoggedIn || isSpinning;
            }

            async function loadProgress() {
              const { data, error } = await supabaseClient.rpc("meu_progresso_giros");

                if (error) {
                    setMessage(spinMessage, "Não foi possível carregar seus giros: " + error.message);
                        return;
                          }

                            const progress = Array.isArray(data) ? data[0] : data;
                              if (!progress) return;

                                remaining.textContent = progress.giros_restantes;
                                  used.textContent = progress.giros_usados;
                                    progressBar.style.width = `${(progress.giros_usados / 5) * 100}%`;

                                      spinBtn.disabled = progress.giros_restantes <= 0 || isSpinning;

                                        if (progress.giros_restantes <= 0) {
                                            setMessage(spinMessage, "Você já utilizou seus 5 giros.");
                                              } else {
                                                  setMessage(spinMessage, `Você tem ${progress.giros_restantes} giro(s) disponível(is).`);
                                                    }
                                                    }

                                                    async function loadHistory() {
                                                      const { data, error } = await supabaseClient.rpc("meu_historico_giros");

                                                        if (error) {
                                                            historyList.replaceChildren();
                                                                const li = document.createElement("li");
                                                                    li.className = "empty-history";
                                                                        li.textContent = "Não foi possível carregar o histórico.";
                                                                            historyList.appendChild(li);
                                                                                return;
                                                                                  }

                                                                                    historyList.replaceChildren();

                                                                                      if (!data || data.length === 0) {
                                                                                          const li = document.createElement("li");
                                                                                              li.className = "empty-history";
                                                                                                  li.textContent = "Você ainda não girou a roleta.";
                                                                                                      historyList.appendChild(li);
                                                                                                          return;
                                                                                                            }

                                                                                                              data.forEach((item) => {
                                                                                                                  const li = document.createElement("li");
                                                                                                                      const clan = document.createElement("strong");
                                                                                                                          const date = document.createElement("time");

                                                                                                                              clan.textContent = item.cla;
                                                                                                                                  date.textContent = new Date(item.criado_em).toLocaleDateString("pt-BR");

                                                                                                                                      li.append(clan, date);
                                                                                                                                          historyList.appendChild(li);
                                                                                                                                            });
                                                                                                                                            }

                                                                                                                                            async function refreshDashboard() {
                                                                                                                                              await loadProgress();
                                                                                                                                                await loadHistory();
                                                                                                                                                }

                                                                                                                                                async function updateSession() {
                                                                                                                                                  const { data, error } = await supabaseClient.auth.getSession();

                                                                                                                                                    if (error) {
                                                                                                                                                        setMessage(authMessage, "Erro ao verificar a sessão.");
                                                                                                                                                            return;
                                                                                                                                                              }

                                                                                                                                                                const session = data.session;
                                                                                                                                                                  showLoggedIn(Boolean(session));

                                                                                                                                                                    if (session) {
                                                                                                                                                                        setMessage(authMessage, "Conectado! Sua jornada ninja começou.");
                                                                                                                                                                            await refreshDashboard();
                                                                                                                                                                              } else {
                                                                                                                                                                                  setMessage(authMessage, "Faça login com o Discord para começar.");
                                                                                                                                                                                      remaining.textContent = "—";
                                                                                                                                                                                          used.textContent = "—";
                                                                                                                                                                                              progressBar.style.width = "0%";
                                                                                                                                                                                                  spinBtn.disabled = true;
                                                                                                                                                                                                      historyList.replaceChildren();

                                                                                                                                                                                                          const li = document.createElement("li");
                                                                                                                                                                                                              li.className = "empty-history";
                                                                                                                                                                                                                  li.textContent = "Faça login para ver seu histórico.";
                                                                                                                                                                                                                      historyList.appendChild(li);
                                                                                                                                                                                                                        }
                                                                                                                                                                                                                        }

                                                                                                                                                                                                                        loginBtn.addEventListener("click", async () => {
                                                                                                                                                                                                                          loginBtn.disabled = true;
                                                                                                                                                                                                                            setMessage(authMessage, "Redirecionando para o Discord...");

                                                                                                                                                                                                                              const { error } = await supabaseClient.auth.signInWithOAuth({
                                                                                                                                                                                                                                  provider: "discord",
                                                                                                                                                                                                                                      options: {
                                                                                                                                                                                                                                            redirectTo: window.location.origin + window.location.pathname
                                                                                                                                                                                                                                                }
                                                                                                                                                                                                                                                  });

                                                                                                                                                                                                                                                    if (error) {
                                                                                                                                                                                                                                                        setMessage(authMessage, "Erro no login: " + error.message);
                                                                                                                                                                                                                                                            loginBtn.disabled = false;
                                                                                                                                                                                                                                                              }
                                                                                                                                                                                                                                                              });

                                                                                                                                                                                                                                                              logoutBtn.addEventListener("click", async () => {
                                                                                                                                                                                                                                                                const { error } = await supabaseClient.auth.signOut();

                                                                                                                                                                                                                                                                  if (error) {
                                                                                                                                                                                                                                                                      setMessage(authMessage, "Não foi possível sair da conta.");
                                                                                                                                                                                                                                                                          return;
                                                                                                                                                                                                                                                                            }

                                                                                                                                                                                                                                                                              setMessage(authMessage, "Você saiu da sua conta.");
                                                                                                                                                                                                                                                                                await updateSession();
                                                                                                                                                                                                                                                                                });

                                                                                                                                                                                                                                                                                spinBtn.addEventListener("click", async () => {
                                                                                                                                                                                                                                                                                  if (isSpinning) return;

                                                                                                                                                                                                                                                                                    isSpinning = true;
                                                                                                                                                                                                                                                                                      spinBtn.disabled = true;
                                                                                                                                                                                                                                                                                        setMessage(spinMessage, "O destino está sendo decidido...");
                                                                                                                                                                                                                                                                                          result.querySelector("small").textContent = "SORTEANDO SEU CLÃ";
                                                                                                                                                                                                                                                                                            result.querySelector("strong").textContent = "???";
                                                                                                                                                                                                                                                                                              wheel.classList.add("spinning");

                                                                                                                                                                                                                                                                                                rotation += 1800 + Math.floor(Math.random() * 720);
                                                                                                                                                                                                                                                                                                  wheel.style.transform = `rotate(${rotation}deg)`;

                                                                                                                                                                                                                                                                                                    const { data, error } = await supabaseClient.rpc("girar_roleta");

                                                                                                                                                                                                                                                                                                      if (error) {
                                                                                                                                                                                                                                                                                                          isSpinning = false;
                                                                                                                                                                                                                                                                                                              wheel.classList.remove("spinning");
                                                                                                                                                                                                                                                                                                                  setMessage(spinMessage, error.message.includes("Limite")
                                                                                                                                                                                                                                                                                                                        ? "Você já utilizou seus 5 giros."
                                                                                                                                                                                                                                                                                                                              : "Não foi possível girar. Tente novamente.");
                                                                                                                                                                                                                                                                                                                                  await refreshDashboard();
                                                                                                                                                                                                                                                                                                                                      return;
                                                                                                                                                                                                                                                                                                                                        }

                                                                                                                                                                                                                                                                                                                                          const outcome = Array.isArray(data) ? data[0] : data;

                                                                                                                                                                                                                                                                                                                                            window.setTimeout(async () => {
                                                                                                                                                                                                                                                                                                                                                result.querySelector("small").textContent = "SEU CLÃ FOI REVELADO";
                                                                                                                                                                                                                                                                                                                                                    result.querySelector("strong").textContent = outcome.cla;
                                                                                                                                                                                                                                                                                                                                                        setMessage(spinMessage, "Clã sorteado! Que sua jornada seja lendária.");
                                                                                                                                                                                                                                                                                                                                                            wheel.classList.remove("spinning");
                                                                                                                                                                                                                                                                                                                                                                isSpinning = false;
                                                                                                                                                                                                                                                                                                                                                                    await refreshDashboard();
                                                                                                                                                                                                                                                                                                                                                                      }, 3000);
                                                                                                                                                                                                                                                                                                                                                                      });

                                                                                                                                                                                                                                                                                                                                                                      supabaseClient.auth.onAuthStateChange((event, session) => {
                                                                                                                                                                                                                                                                                                                                                                        if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "INITIAL_SESSION") {
                                                                                                                                                                                                                                                                                                                                                                            setTimeout(() => updateSession(), 0);
                                                                                                                                                                                                                                                                                                                                                                              }
                                                                                                                                                                                                                                                                                                                                                                              });

                                                                                                                                                                                                                                                                                                                                                                              updateSession();
                                                                                                                                                                                                                                                                                                                                                                              