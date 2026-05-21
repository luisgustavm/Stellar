export function getAuthErrorMessage(error) {
  const code = error?.code || "";

  const messages = {
    "auth/email-already-in-use": "Este email já está cadastrado.",
    "auth/invalid-email": "Digite um email válido.",
    "auth/invalid-credential": "Email ou senha incorretos.",
    "auth/missing-password": "Digite sua senha.",
    "auth/popup-closed-by-user": "Login com Google cancelado.",
    "auth/popup-blocked": "O navegador bloqueou o popup do Google. Permita popups e tente novamente.",
    "auth/cancelled-popup-request": "Já existe uma janela de login Google aberta.",
    "auth/operation-not-allowed": "O login com Google não está habilitado no Firebase.",
    "auth/unauthorized-domain": "Este domínio não está autorizado no Firebase. Use localhost ou autorize o domínio.",
    "auth/no-current-user": "Nenhum usuário autenticado foi encontrado.",
    "auth/requires-recent-login": "Por segurança, entre novamente na conta antes de excluir.",
    "auth/too-many-requests": "Muitas tentativas. Tente novamente em alguns minutos.",
    "auth/user-disabled": "Esta conta está desativada.",
    "auth/user-not-found": "Usuário não encontrado.",
    "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres.",
    "auth/wrong-password": "Senha incorreta.",
  };

  return messages[code] || "Algo deu errado. Tente novamente.";
}
