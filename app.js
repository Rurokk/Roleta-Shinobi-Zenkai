
const SUPABASE_URL = "https://lmskxdlpannjnbdqveug.supabase.co";
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
progressBar.style.width = ${(progress.giros_usados / 5) * 100}%`;

spinBtn.disabled = progress.giros_restantes <= 0 || isSpinning;

if (progress.giros_restantes <= 0) {
setMessage(spinMessage, "Você já utilizou seus 5 giros.");
} else {
setMessage(spinMessage, Você tem${progress.giros_restantes} giro(s) disponível(is).`);
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
wheel.style.transform = rotate(${rotation}deg);

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

rita ao proprietário no banco.
  let owner = false;

  try {
    await callRPC("admin_listar_auditoria");
    owner = true;
  } catch {}

  if (owner) {
    allowed.push("permissions", "audit");
  }

  if (!allowed.length) return;

  adminPanel.classList.remove("hidden");

  message(
    adminMessage,
    owner
      ? "Acesso de proprietário confirmado."
      : "Permissões administrativas detectadas."
  );

  const sections = ADMIN_SECTIONS.filter(
    section => allowed.includes(section.id)
  );

  sections.forEach((section, index) => {
    const button = document.createElement("button");

    button.className = `admin-tab${index === 0 ? " active" : ""}`;
    button.textContent = section.label;

    button.addEventListener("click", () => {
      adminTabs.querySelectorAll("button").forEach(item => {
        item.classList.toggle("active", item === button);
      });

      renderAdmin(section.id);
    });

    adminTabs.appendChild(button);
  });

  if (sections.length) {
    await renderAdmin(sections[0].id);
  }
}

function renderMetrics(data) {
  const values = [
    ["Jogadores", data.total_jogadores ?? data.jogadores ?? 0],
    ["Giros usados", data.total_giros ?? data.giros_usados ?? 0],
    ["Giros extras", data.total_giros_extras ?? data.giros_extras ?? 0]
  ];

  adminContent.innerHTML = `
    <h3>Estatísticas gerais</h3>
    <div class="metric-grid">
      ${values.map(([label, value]) => `
        <div class="metric">
          <small>${esc(label)}</small>
          <strong>${esc(value)}</strong>
        </div>
      `).join("")}
    </div>
  `;

  if (Array.isArray(data.resultados_por_cla) &&
      data.resultados_por_cla.length) {
    adminContent.innerHTML += `
      <h3>Resultados por clã</h3>
      ${table(
        ["Clã", "Resultados"],
        data.resultados_por_cla.map(row => [
          row.cla || row.nome,
          row.total ?? row.quantidade ?? row.count ?? 0
        ])
      )}
    `;
  }
}

async function renderAdmin(section) {
  adminContent.innerHTML = '<p class="muted">Carregando…</p>';

  try {
    if (section === "players") {
      const rows = await callRPC("admin_listar_jogadores");

      adminContent.innerHTML = `
        <h3>Jogadores</h3>
        <p class="muted">
          O identificador mostrado é o UUID de autenticação utilizado pelo banco.
        </p>
        ${table(
          [
            "ID de autenticação",
            "Giros usados",
            "Extras",
            "Normais restantes",
            "Total restante"
          ],
          (rows || []).map(row => [
            row.discord_id,
            row.giros_usados,
            row.giros_extras,
            row.giros_normais_restantes,
            row.giros_totais_restantes
          ])
        )}
      `;

    } else if (section === "spins") {
      adminContent.innerHTML = `
        <h3>Gerenciar giros extras</h3>
        <p class="muted">
          Use o UUID de autenticação do jogador. Quantidade positiva concede
          giros; quantidade negativa retira.
        </p>

        <form id="spinAdminForm" class="admin-form">
          <input id="spinUserId" placeholder="UUID do jogador" required>
          <input id="spinAmount" type="number" step="1" min="-1000"
            max="1000" placeholder="Quantidade (+/-)" required>
          <button class="btn spin" type="submit">Aplicar alteração</button>
        </form>

        <p id="spinAdminStatus" class="notice">
          A alteração será validada pelo servidor.
        </p>
      `;

      $("spinAdminForm").addEventListener("submit", async event => {
        event.preventDefault();

        const uid = $("spinUserId").value.trim();
        const amount = Number($("spinAmount").value);

        if (!uid || !Number.isInteger(amount) || amount === 0) {
          toastMessage("Informe o UUID e uma quantidade inteira diferente de zero.");
          return;
        }

        try {
          await callRPC("admin_ajustar_giros", {
            p_user_id: uid,
            p_quantidade: amount
          });

          message($("spinAdminStatus"), "Alteração concluída.");
          toastMessage("Giros atualizados.");

        } catch (error) {
          message($("spinAdminStatus"), "Falha: " + error.message);
        }
      });

    } else if (section === "clans") {
      const rows = await callRPC("admin_listar_clas");

      adminContent.innerHTML = `
        <h3>Clãs</h3>
        <p class="muted">
          Lista dos pesos e estados atuais. Para alterar pesos ou ativação,
          é necessário usar funções SQL administrativas protegidas.
        </p>
        ${table(
          ["ID", "Nome", "Peso", "Ativo"],
          (rows || []).map(row => [
            row.id,
            row.nome,
            row.peso,
            row.ativo ? "Sim" : "Não"
          ])
        )}
      `;

    } else if (section === "stats") {
      renderMetrics(one(await callRPC("admin_obter_estatisticas")) || {});

    } else if (section === "audit") {
      const rows = await callRPC("admin_listar_auditoria");

      adminContent.innerHTML = `
        <h3>Auditoria administrativa</h3>
        ${table(
          ["Data", "Ação", "Alvo", "Detalhes"],
          (rows || []).map(row => [
            row.criado_em || row.created_at,
            row.acao || row.acao_tipo,
            row.alvo || row.target_user_id,
            JSON.stringify(row.detalhes || row.metadata || "")
          ])
        )}
      `;

    } else if (section === "permissions") {
      adminContent.innerHTML = `
        <h3>Permissões da equipe</h3>
        <p class="muted">
          Somente o proprietário pode alterar permissões.
        </p>

        <form id="permissionsForm" class="admin-form permissions-form">
          <input id="permissionUserId" placeholder="UUID do usuário" required>

          ${[
            "gerenciar_jogadores",
            "consultar_estatisticas",
            "gerenciar_giros",
            "gerenciar_eventos",
            "gerenciar_clas",
            "gerenciar_configuracoes"
          ].map(permission => `
            <label class="check">
              <input type="checkbox" value="${permission}">
              ${permission.replaceAll("_", " ")}
            </label>
          `).join("")}

          <button class="btn spin" type="submit">Salvar permissões</button>
        </form>

        <p id="permissionStatus" class="notice">
          As permissões serão validadas pelo banco.
        </p>
      `;

      $("permissionsForm").addEventListener("submit", async event => {
        event.preventDefault();

        const uid = $("permissionUserId").value.trim();
        const permissions = {};

        $("permissionsForm")
          .querySelectorAll('input[type="checkbox"]')
          .forEach(input => {
            permissions[input.value] = input.checked;
          });

        try {
          await callRPC("admin_definir_permissoes", {
            p_user_id: uid,
            p_permissoes: permissions
          });

          message($("permissionStatus"), "Permissões atualizadas.");
          toastMessage("Permissões salvas.");

        } catch (error) {
          message(
            $("permissionStatus"),
            "Falha ao salvar: " + error.message
          );
        }
      });
    }

  } catch (error) {
    console.error("Falha no painel:", error);

    adminContent.innerHTML = `
      <p class="notice">
        Não foi possível carregar esta seção:
        ${esc(error.message || "erro desconhecido")}
      </p>
    `;
  }
}

/* LOGIN E INICIALIZAÇÃO */

async function updateSession() {
  const { data, error } = await supabaseClient.auth.getSession();

  if (error) {
    message(authMessage, "Não foi possível verificar a sessão.");
    return;
  }

  session = data.session;
  setLoginState(Boolean(session));

  if (session) {
    welcomeTitle.textContent = "Jornada ninja iniciada";

    message(
      authMessage,
      "Conta conectada. Seus giros e resultados são registrados no banco."
    );

    await refreshDashboard();
    await checkAdmin();

  } else {
    welcomeTitle.textContent = "Entre com o Discord";
    message(authMessage, "Conecte sua conta para registrar seus giros.");

    remainingEl.textContent = "—";
    usedEl.textContent = "—";
    extrasEl.textContent = "—";

    progressBar.style.width = "0%";
    emptyList(historyList, "Faça login para ver seu histórico.");

    adminPanel.classList.add("hidden");
    spinBtn.disabled = true;
  }
}


loginBtn.addEventListener("click", async () => {
  loginBtn.disabled = true;
  message(authMessage, "Conectando ao Discord...");

  try {
    const { data, error } =
      await supabaseClient.auth.signInWithOAuth({
        provider: "discord",
        options: {
          redirectTo: window.location.origin + "/"
        }
      });

    if (error) throw error;

    if (data?.url) {
      window.location.assign(data.url);
      return;
    }

    throw new Error("O Supabase não retornou a URL de login.");
  } catch (error) {
    console.error("Erro no login Discord:", error);
    message(authMessage, "Erro no login: " + error.message);
    toastMessage("Não foi possível iniciar o login com Discord.");
    loginBtn.disabled = false;
  }
});


logoutBtn.addEventListener("click", async () => {
  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    toastMessage("Não foi possível sair da conta.");
    return;
  }

  session = null;
  await updateSession();
});

spinBtn.addEventListener("click", spin);

supabaseClient.auth.onAuthStateChange((_event, newSession) => {
  session = newSession;
  setTimeout(() => updateSession(), 0);
});

async function init() {
  await loadClans();
  await updateSession();

  window.addEventListener("resize", () => {
    if (!isSpinning) drawWheel();
  });
}

init();
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
                                                                                                                                                                                                                                                                                                                                                                              
