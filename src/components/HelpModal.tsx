import { useEffect } from 'react'

export default function HelpModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between p-5 pb-3 border-b border-slate-100">
          <h2 className="text-xl font-black">Como usar</h2>
          <button type="button" onClick={onClose} aria-label="Fechar" className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 font-bold">✕</button>
        </div>

        <div className="overflow-y-auto p-5 space-y-6 text-[15px] leading-relaxed text-slate-700">
          <Section icon="🏢" title="1. Cadastre os prédios e apartamentos">
            <p>Na aba <b>Prédios</b>, digite o nome do prédio e toque em <b>+ Prédio</b>. Dentro de cada prédio, adicione os apartamentos com <b>+ Apto</b>.</p>
            <p>Toque no nome de um prédio ou apartamento pra renomear. Pra excluir, use o <b>✕</b> (só funciona se não houver reservas nele).</p>
          </Section>

          <Section icon="📅" title="2. Marque uma reserva">
            <p>Toque em <b>+ Nova</b> no topo, ou em <b>+ Adicionar reserva</b> num apartamento livre, ou num espaço vazio do calendário.</p>
            <p>Preencha o hóspede, quantas pessoas, entrada e saída, e quem fez a reserva. Telefone e observações são opcionais.</p>
            <p>O app não deixa marcar duas reservas no mesmo apartamento com datas cruzadas.</p>
          </Section>

          <Section icon="✏️" title="3. Edite ou exclua">
            <p>Toque no card do apartamento (tela Hoje) ou na barra colorida (Calendário) pra abrir a reserva. Altere o que precisar e toque em <b>Salvar</b>, ou em <b>Excluir</b>.</p>
          </Section>

          <Section icon="👀" title="Tela Hoje">
            <p>Mostra a situação de agora: quantos apartamentos estão ocupados, quantos livres e quantas pessoas no total.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><b>Card colorido</b> = ocupado. Mostra o hóspede, quantas pessoas, até quando fica e quem reservou.</li>
              <li><b>Card tracejado</b> = livre. Mostra a próxima reserva, se houver.</li>
              <li><b>"Sai hoje" / "Chegou hoje"</b> ficam em destaque branco.</li>
            </ul>
          </Section>

          <Section icon="🗓️" title="Tela Calendário">
            <p>Cada linha é um apartamento, cada coluna é um dia. As barras coloridas são as reservas; o número na barra é a quantidade de pessoas.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Arraste pro lado pra ver os outros dias; use <b>‹ ›</b> pra trocar de mês e <b>Hoje</b> pra voltar.</li>
              <li>A coluna azul é o dia de hoje. Fim de semana fica sombreado.</li>
              <li>Toque num espaço vazio pra criar reserva já naquele dia e apartamento.</li>
            </ul>
          </Section>

          <Section icon="🔄" title="Várias pessoas ao mesmo tempo">
            <p>Todo mundo que abrir o link vê as mesmas reservas. Quando alguém cria ou altera algo, aparece na tela dos outros na hora, sem precisar recarregar.</p>
          </Section>

          <Section icon="📱" title="Colocar na tela inicial do celular">
            <p>Fica como um aplicativo, sem precisar procurar o link.</p>
            <p><b>iPhone (Safari):</b> toque no botão de compartilhar <span className="inline-block px-1.5 rounded bg-slate-100 font-mono text-sm">⎋</span> na barra de baixo → role e toque em <b>Adicionar à Tela de Início</b> → <b>Adicionar</b>.</p>
            <p><b>Android (Chrome):</b> toque no menu <span className="inline-block px-1.5 rounded bg-slate-100 font-mono text-sm">⋮</span> no canto superior direito → <b>Adicionar à tela inicial</b> (ou <b>Instalar app</b>) → <b>Adicionar</b>.</p>
          </Section>

          <Section icon="💻" title="No computador">
            <p>Abra o link no navegador e salve nos favoritos (<b>Ctrl+D</b> no Windows, <b>⌘D</b> no Mac). No Chrome e no Edge também dá pra instalar como aplicativo: ícone de instalar na barra de endereço ou menu → <b>Instalar</b>.</p>
          </Section>
        </div>
      </div>
    </div>
  )
}

function Section({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="font-black text-slate-900 mb-1.5 flex items-center gap-2"><span>{icon}</span>{title}</h3>
      <div className="space-y-1.5">{children}</div>
    </section>
  )
}
