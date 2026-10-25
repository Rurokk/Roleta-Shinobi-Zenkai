
const SUPABASE_URL = "https://lmskxdlpannjnbdqveug.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_bOTpjvruQ9EHN0BecbLGoQ_F53oQdWg";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const $ = id => document.getElementById(id);

const loginBtn = $("loginBtn");
const logoutBtn = $("logoutBtn");
const connectionStatus = $("connectionStatus");
const authMessage = $("authMessage");
const welcomeTitle = $("welcomeTitle");
const spinBtn = $("spinBtn");
const spinMessage = $("spinMessage");
const wheel = $("wheel");
const resultName = $("resultName");
const resultDetail = $("resultDetail");
const remainingEl = $("remaining");
const usedEl = $("used");
const extrasEl = $("extras");
const progressBar = $("progressBar");
const historyList = $("historyList");
const adminPanel = $("adminPanel");
const adminMessage = $("adminMessage");
const adminTabs = $("adminTabs");
const adminContent = $("adminContent");
const toast = $("toast");

let session = null;
let isSpinning = false;
let rotation = 0;
let activeClans = [];
let toastTimer;

const ADMIN_SECTIONS = [
  { id: "players", label: "Jogadores", permission: "gerenciar_jogadores" },
  { id: "spins", label: "Gerenciar giros", permission: "gerenciar_giros" },
  { id: "clans", label: "Clãs", permission: "gerenciar_clas" },
  { id: "stats", label: "Estatísticas", permission: "consultar_estatisticas" },
  { id: "permissions", label: "Permissões", ownerOnly: true },
  { id: "audit", label: "Auditoria", ownerOnly: true }
];

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[c]);
}

function message(element, text) {
  if (element) element.textContent = text;
}

function toastMessage(text) {
  toast.textContent = text;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3500);
}

function emptyList(list, text) {
  list.replaceChildren();
  const li = document.createElement("li");
  li.className = "empty";
  li.textContent = text;
  list.appendChild(li);
}

function one(data) {
  return Array.isArray(data) ? data[0] : data;
}

async function callRPC(name, args = {}) {
  const { data, error } = await supabaseClient.rpc(name, args);
  if (error) throw error;
  return data;
}

function setLoginState(connected) {
  loginBtn.classList.toggle("hidden", connected);
  logoutBtn.classList.toggle("hidden", !connected);
  connectionStatus.classList.toggle("connected", connected);

  connectionStatus.innerHTML =
    `<i></i>${connected ? "Discord conectado" : "Desconectado"}`;

  spinBtn.disabled = !connected || isSpinning;
}

/* CARREGAMENTO E DESENHO DA ROLETA */

async function loadClans() {
  const { data, error } = await supabaseClient
    .from("cla_opcoes")
    .select("id,nome,peso,ativo")
    .eq("ativo", true)
    .order("nome", { ascending: true });

  if (error) {
    console.error("Erro ao carregar clãs:", error);
    message(
      spinMessage,
      "Não foi possível carregar os clãs. Verifique as permissões de leitura no Supabase."
    );
    return;
  }

  activeClans = data || [];
  drawWheel();
}

function drawWheel() {
  wheel.querySelectorAll(".wheel-label").forEach(el => el.remove());

  const placeholder = $("wheelPlaceholder");

  if (!activeClans.length) {
    placeholder.classList.remove("hidden");
    wheel.style.background =
      "conic-gradient(#35121e,#8f263d,#b8863b,#35121e)";
    return;
  }

  placeholder.classList.add("hidden");

  const colors = [
    "#7d1d2b", "#27141d", "#a62b3a", "#21141b",
    "#9b6c38", "#4c1726", "#522032", "#34202a"
  ];

  const step = 360 / activeClans.length;

  wheel.style.background = `conic-gradient(from -90deg, ${
    activeClans.map((clan, i) =>
      `${colors[i % colors.length]} ${i * step}deg ${(i + 1) * step}deg`
    ).join(",")
  })`;

  const size = wheel.clientWidth || 280;
  const radius = size * (activeClans.length > 16 ? 0.36 : 0.34);
  const labelWidth = Math.max(
    34,
    Math.min(74, size * Math.PI / activeClans.length * 0.9)
  );

  const fontSize =
    activeClans.length > 22 ? 6 :
    activeClans.length > 15 ? 7 : 8;

  activeClans.forEach((clan, i) => {
    const middle = i * step + step / 2;

    const label = document.createElement("div");
    label.className = "wheel-label";
    label.style.transform = `rotate(${middle}deg)`;

    const span = document.createElement("span");
    span.textContent = clan.nome;
    span.title = clan.nome;
    span.style.width = `${labelWidth}px`;
    span.style.marginLeft = `${-labelWidth / 2}px`;
    span.style.fontSize = `${fontSize}px`;
    span.style.setProperty("--radius", `${radius}px`);
    span.style.setProperty("--label-rotation", `${-middle}deg`);

    label.appendChild(span);
    wheel.appendChild(label);
  });
}

/* PROGRESSO E HISTÓRICO */

async function loadProgress() {
  const p = one(await callRPC("meu_progresso_giros"));
  if (!p) return;

  const remaining = Number(
    p.giros_restantes ?? p.giros_totais_disponiveis ?? 0
  );

  const used = Number(p.giros_usados ?? 0);
  const extras = Number(p.giros_extras ?? 0);

  remainingEl.textContent = remaining;
  usedEl.textContent = used;
  extrasEl.textContent = extras;

  progressBar.style.width =
    `${Math.max(0, Math.min(100, used / 5 * 100))}%`;

  spinBtn.disabled = !session || remaining <= 0 || isSpinning;

  message(
    spinMessage,
    remaining > 0
      ? `Você tem ${remaining} giro(s) disponível(is).`
      : "Você não tem giros disponíveis."
  );
}

async function loadHistory() {
  const rows = await callRPC("meu_historico_giros");

  historyList.replaceChildren();

  if (!rows || !rows.length) {
    emptyList(historyList, "Você ainda não girou a roleta.");
    return;
  }

  rows.forEach(row => {
    const li = document.createElement("li");
    li.className = "history-item";

    const clan = document.createElement("strong");
    clan.textContent = row.cla || "Clã desconhecido";

    const date = document.createElement("small");
    date.textContent = row.criado_em
      ? new Date(row.criado_em).toLocaleString("pt-BR", {
          dateStyle: "short",
          timeStyle: "short"
        })
      : "";

    li.append(clan, date);
    historyList.appendChild(li);
  });
}

async function refreshDashboard() {
  try {
    await Promise.all([loadProgress(), loadHistory()]);
  } catch (error) {
    console.error(error);
    message(
      spinMessage,
      "Erro ao carregar os dados. Confira as funções SQL do Supabase."
    );
  }
}

/* RARIDADE VISUAL */

function rarity(weight) {
  const w = Number(weight);

  if (w <= 2) return "Lendário";
  if (w <= 4) return "Épico";
  if (w <= 5) return "Raro";
  return "Comum";
}

/* GIRO */

function animateWheel(clanName) {
  const index = activeClans.findIndex(c => c.nome === clanName);

  if (index < 0 || !activeClans.length) {
    rotation += 6 * 360 + Math.random() * 360;
  } else {
    const step = 360 / activeClans.length;
    const target =
      (360 - (index * step + step / 2) + 360) % 360;

    const current = ((rotation % 360) + 360) % 360;

    rotation += 6 * 360 + (target - current + 360) % 360;
  }

  wheel.style.transform = `rotate(${rotation}deg)`;
}

async function spin() {
  if (!session || isSpinning) return;

  isSpinning = true;
  spinBtn.disabled = true;
  wheel.classList.add("spinning");

  resultName.textContent = "…";
  resultDetail.textContent = "O destino está sendo decidido.";
  message(spinMessage, "A roleta está girando…");

  try {
    // O banco decide o resultado e desconta o giro.
    const result = one(await callRPC("girar_roleta"));

    const clanName = typeof result === "string"
      ? result
      : result?.cla || result?.nome || result?.resultado;

    if (!clanName) {
      throw new Error(
        "A função girar_roleta não retornou o nome do clã esperado."
      );
    }

    animateWheel(clanName);

    setTimeout(async () => {
      resultName.textContent = clanName;

      const clan = activeClans.find(c => c.nome === clanName);

      resultDetail.textContent = clan
        ? `Raridade visual: ${rarity(clan.peso)}`
        : "Resultado confirmado pelo servidor.";

      $("result").classList.remove("result-pop");
      void $("result").offsetWidth;
      $("result").classList.add("result-pop");

      wheel.classList.remove("spinning");
      isSpinning = false;

      await refreshDashboard();
    }, 5100);

  } catch (error) {
    console.error("Erro ao girar:", error);

    wheel.classList.remove("spinning");
    isSpinning = false;

    message(spinMessage, error.message || "Não foi possível girar.");
    toastMessage(error.message || "Erro ao girar.");

    await loadProgress().catch(() => {});
  }
}

/* FERRAMENTAS DO PAINEL ADMINISTRATIVO */

function table(headers, rows) {
  if (!rows.length) {
    return '<p class="empty">Nenhum registro encontrado.</p>';
  }

  return `
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>${headers.map(h => `<th>${esc(h)}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${rows.map(row => `
            <tr>${row.map(value =>
              `<td>${esc(value ?? "—")}</td>`
            ).join("")}</tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

async function checkAdmin() {
  adminPanel.classList.add("hidden");
  adminTabs.replaceChildren();
  adminContent.replaceChildren();

  if (!session) return;

  const allowed = [];

  for (const section of ADMIN_SECTIONS) {
    if (section.ownerOnly) continue;

    try {
      const value = await callRPC("admin_tem_permissao", {
        p_permissao: section.permission
      });

      if (value === true || value === "true") {
        allowed.push(section.id);
      }
    } catch (error) {
      console.debug("Permissão indisponível:", section.id, error.message);
    }
  }

  // A auditoria é restrita ao proprietário no banco.
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
                                                                                                                                                                                                                                                                                                                                                                              
