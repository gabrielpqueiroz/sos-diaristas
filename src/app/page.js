'use client'

import Image from 'next/image'
import { useState } from 'react'

const WHATSAPP_NUMBER = '5545998183986'

const services = [
  {
    icon: '🏠',
    color: 'bg-blue-50',
    title: 'Limpeza Completa 8 horas',
    description:
      'Limpeza profunda em toda a residência ou empresa. Ideal para quem quer aquele resultado impecável, do chão ao teto.',
  },
  {
    icon: '⚡',
    color: 'bg-amber-50',
    title: 'Limpeza Completa 5 horas',
    description:
      'Serviço otimizado para espaços menores ou manutenção periódica. Mesma qualidade, em menos tempo.',
  },
  {
    icon: '🔨',
    color: 'bg-orange-50',
    title: 'Limpeza Pós-Obra',
    description:
      'Especialistas em remover resíduos de construção e reforma. Sua obra entregue limpa e pronta para morar.',
  },
  {
    icon: '🛋️',
    color: 'bg-purple-50',
    title: 'Limpeza de Estofados',
    description:
      'Higienização profunda de sofás, poltronas e cadeiras. Elimina sujeira, ácaros e odores indesejados.',
  },
  {
    icon: '🛏️',
    color: 'bg-teal-50',
    title: 'Higienização de Colchões',
    description:
      'Limpeza completa que elimina ácaros, bactérias e fungos. Durma melhor em um colchão verdadeiramente limpo.',
  },
  {
    icon: '🏢',
    color: 'bg-indigo-50',
    title: 'Limpeza Empresarial',
    description:
      'Atendemos farmácias, clínicas, fábricas, panificadoras, mercados e muito mais. Ambiente profissional exige limpeza profissional.',
  },
]

const stats = [
  { value: '+10', label: 'anos em Foz do Iguaçu' },
  { value: '+500', label: 'clientes atendidos' },
  { value: '100%', label: 'profissionais treinados' },
  { value: '4–10h', label: 'carga horária flexível' },
]

const testimonials = [
  {
    name: 'Maria S.',
    role: 'Moradora – Vila A',
    text: 'Serviço impecável! A equipe foi pontual, cuidadosa e deixou minha casa como nova. Recomendo para todo mundo.',
  },
  {
    name: 'Carlos M.',
    role: 'Empresário – Centro',
    text: 'Contratamos para limpeza da nossa clínica e ficamos impressionados com o profissionalismo. Agora temos contrato mensal.',
  },
  {
    name: 'Ana L.',
    role: 'Moradora – Morumbi',
    text: 'Após a reforma do apartamento, a SOS Diaristas fez um trabalho incrível. Tudo limpo e sem nenhum resquício de obra.',
  },
]

export default function Home() {
  const [form, setForm] = useState({ name: '', phone: '', service: '', email: '' })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    try {
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'Lead', { content_name: 'Formulario Landing Page' })
      }

      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'conversion', {
          send_to: `${process.env.NEXT_PUBLIC_GOOGLE_ADS_ID}/CONVERSION_LABEL`,
        })
      }

      await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
    } catch (err) {
      console.error('CAPI error:', err)
    }

    setSent(true)
    setLoading(false)

    const service = form.service ? ` Serviço: ${form.service}.` : ''
    const msg = encodeURIComponent(
      `Olá! Vim pelo site e gostaria de um orçamento.\n\n*Nome:* ${form.name}\n*Telefone:* ${form.phone}${service}`
    )
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank')
  }

  return (
    <main>
      {/* ── NAVBAR ───────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        {/* Thin blue accent line at very top */}
        <div className="h-0.5 bg-gradient-to-r from-brand-navy via-brand-blue to-blue-400 absolute top-0 left-0 right-0" />
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <Image src="/logo.png" alt="SOS Diaristas" width={160} height={50} className="h-9 w-auto" />
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
            <a href="#servicos" className="hover:text-brand-blue transition-colors">Serviços</a>
            <a href="#sobre" className="hover:text-brand-blue transition-colors">Sobre</a>
            <a href="#contato" className="hover:text-brand-blue transition-colors">Contato</a>
          </div>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-5 py-2.5 rounded-full transition-all duration-200 text-sm shadow-sm hover:shadow-md"
          >
            <WhatsAppIcon />
            <span className="hidden sm:block">Falar no WhatsApp</span>
          </a>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section
        className="pt-24 pb-20 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1A3A6B 0%, #1B5FA8 60%, #2b7fd4 100%)' }}
      >
        {/* Subtle dot pattern overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1.5px 1.5px, rgba(255,255,255,0.12) 1.5px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute -bottom-24 -left-12 w-72 h-72 bg-white/5 rounded-full" />

        <div className="max-w-6xl mx-auto px-4 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div className="text-white">
              <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 text-white/90 text-xs font-semibold px-4 py-2 rounded-full mb-8 anim-fade-up">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                Foz do Iguaçu – PR
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold leading-[1.1] mb-6 anim-fade-up anim-d1">
                Sua casa{' '}
                <span
                  style={{
                    backgroundImage: 'linear-gradient(90deg, #fbbf24, #fde68a)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  limpa e cheirosa
                </span>{' '}
                <br className="hidden md:block" />
                sem você se preocupar
              </h1>

              <p className="text-lg text-blue-100 mb-8 leading-relaxed anim-fade-up anim-d2 max-w-lg">
                Mais de <strong className="text-white font-bold">10 anos</strong> cuidando dos lares
                e empresas de Foz do Iguaçu. Profissionais treinados, produtos premium e total
                tranquilidade para você.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 anim-fade-up anim-d3">
                <a href="#orcamento" className="btn-primary text-center">
                  Solicitar orçamento grátis
                </a>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-whatsapp"
                >
                  <WhatsAppIcon />
                  WhatsApp
                </a>
              </div>

              <div className="mt-10 flex items-center gap-4 anim-fade-up anim-d4">
                <div className="flex -space-x-2">
                  {['😊', '😄', '🙂', '😃'].map((emoji, i) => (
                    <div
                      key={i}
                      className="w-9 h-9 rounded-full bg-white/25 border-2 border-white flex items-center justify-center text-sm"
                    >
                      {emoji}
                    </div>
                  ))}
                </div>
                <p className="text-blue-100 text-sm">
                  <strong className="text-white font-bold">+500 clientes</strong> satisfeitos em
                  Foz do Iguaçu
                </p>
              </div>
            </div>

            {/* Right – form */}
            <div id="orcamento" className="anim-fade-up anim-d2">
              <div className="bg-white rounded-3xl shadow-2xl p-8 text-gray-800">
                {sent ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-brand-navy mb-2">Enviado com sucesso!</h3>
                    <p className="text-gray-500 text-sm">
                      Você foi redirecionado para o WhatsApp. Nossa equipe responderá em breve!
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mb-6">
                      <h2 className="text-xl font-bold text-brand-navy">Solicite seu orçamento</h2>
                      <p className="text-gray-400 text-sm mt-1">
                        Preencha abaixo — é rápido e sem compromisso
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                          Nome completo *
                        </label>
                        <input
                          name="name"
                          type="text"
                          required
                          placeholder="Seu nome completo"
                          value={form.name}
                          onChange={handleChange}
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue text-gray-800 placeholder-gray-300 bg-gray-50 focus:bg-white transition-all duration-200"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                          WhatsApp *
                        </label>
                        <input
                          name="phone"
                          type="tel"
                          required
                          placeholder="(45) 99999-9999"
                          value={form.phone}
                          onChange={handleChange}
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue text-gray-800 placeholder-gray-300 bg-gray-50 focus:bg-white transition-all duration-200"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                          Tipo de serviço
                        </label>
                        <select
                          name="service"
                          value={form.service}
                          onChange={handleChange}
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue text-gray-700 bg-gray-50 focus:bg-white transition-all duration-200 appearance-none"
                        >
                          <option value="">Selecione (opcional)</option>
                          <option>Limpeza Completa 8 horas</option>
                          <option>Limpeza Completa 5 horas</option>
                          <option>Limpeza Pós-Obra</option>
                          <option>Limpeza de Estofados</option>
                          <option>Higienização de Colchões</option>
                          <option>Limpeza Empresarial</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                          E-mail{' '}
                          <span className="normal-case font-normal text-gray-300">(opcional)</span>
                        </label>
                        <input
                          name="email"
                          type="email"
                          placeholder="seu@email.com"
                          value={form.email}
                          onChange={handleChange}
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue text-gray-800 placeholder-gray-300 bg-gray-50 focus:bg-white transition-all duration-200"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg text-sm flex items-center justify-center gap-2.5 tracking-wide"
                      >
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                              />
                            </svg>
                            Enviando...
                          </span>
                        ) : (
                          <>
                            <WhatsAppIcon />
                            Enviar e continuar no WhatsApp
                          </>
                        )}
                      </button>
                    </form>

                    <p className="text-xs text-gray-300 text-center mt-4 flex items-center justify-center gap-1.5">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Seus dados estão protegidos. Não enviamos spam.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────────── */}
      <section className="bg-white py-10 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={`text-center py-6 ${i < stats.length - 1 ? 'border-r border-gray-100' : ''}`}
              >
                <div className="text-4xl font-extrabold text-brand-blue">{s.value}</div>
                <div className="text-gray-500 text-sm mt-1 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVIÇOS ─────────────────────────────────────────────────────── */}
      <section id="servicos" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <span className="inline-block bg-brand-light text-brand-blue font-semibold text-xs uppercase tracking-widest px-4 py-2 rounded-full mb-4">
              O que fazemos
            </span>
            <h2 className="section-title">Nossos Serviços</h2>
            <p className="text-gray-400 mt-4 max-w-xl mx-auto text-sm leading-relaxed">
              Soluções profissionais de limpeza para residências e empresas em Foz do Iguaçu.
              Carga horária de 4h a 10h, conforme sua necessidade.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((s) => (
              <div
                key={s.title}
                className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-brand-blue/25 hover:shadow-md transition-all duration-300 group"
              >
                <div
                  className={`inline-flex w-12 h-12 ${s.color} rounded-xl items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-200`}
                >
                  {s.icon}
                </div>
                <h3 className="font-bold text-brand-navy mb-2 text-sm">{s.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Olá! Gostaria de saber mais sobre os serviços da SOS Diaristas.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp inline-flex"
            >
              <WhatsAppIcon />
              Solicitar orçamento pelo WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ── POR QUE NÓS ──────────────────────────────────────────────────── */}
      <section
        className="py-20 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1A3A6B 0%, #1B5FA8 100%)' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="max-w-6xl mx-auto px-4 relative">
          <div className="text-center mb-14">
            <span className="inline-block bg-white/10 border border-white/20 text-yellow-300 font-semibold text-xs uppercase tracking-widest px-4 py-2 rounded-full mb-4">
              Nossos diferenciais
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold">
              Por que escolher a SOS Diaristas?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { num: '01', title: '+10 anos de experiência', desc: 'Referência em limpeza profissional em Foz do Iguaçu' },
              { num: '02', title: 'Profissionais selecionados', desc: 'Equipe qualificada, treinada e de total confiança' },
              { num: '03', title: 'Produtos premium', desc: 'Removedores especiais e solventes profissionais' },
              { num: '04', title: 'Horários flexíveis', desc: 'Adaptamos o serviço à sua rotina e necessidades' },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white/10 border border-white/10 rounded-2xl p-6 hover:bg-white/15 transition-colors"
              >
                <div className="text-4xl font-extrabold text-white/20 mb-3 font-mono">
                  {item.num}
                </div>
                <h3 className="font-bold text-base mb-2">{item.title}</h3>
                <p className="text-blue-200 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEPOIMENTOS ──────────────────────────────────────────────────── */}
      <section className="py-20 bg-brand-light">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <span className="inline-block bg-white text-brand-blue font-semibold text-xs uppercase tracking-widest px-4 py-2 rounded-full mb-4">
              Depoimentos
            </span>
            <h2 className="section-title">O que nossos clientes dizem</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-6 shadow-sm border border-blue-50">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-5">"{t.text}"</p>
                <div>
                  <div className="font-bold text-brand-navy text-sm">{t.name}</div>
                  <div className="text-gray-400 text-xs mt-0.5">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOBRE ────────────────────────────────────────────────────────── */}
      <section id="sobre" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block bg-brand-light text-brand-blue font-semibold text-xs uppercase tracking-widest px-4 py-2 rounded-full mb-4">
                Nossa história
              </span>
              <h2 className="section-title mb-6">Sobre a SOS Diaristas</h2>
              <p className="text-gray-500 leading-relaxed mb-4 text-sm">
                Há mais de uma década, a SOS Diaristas se destaca como referência em serviços de
                limpeza profissional em Foz do Iguaçu — atendendo residências e empresas com
                excelência e compromisso.
              </p>
              <p className="text-gray-500 leading-relaxed mb-4 text-sm">
                Nossa equipe é rigorosamente selecionada e passa por treinamentos constantes,
                garantindo qualidade em cada detalhe. Utilizamos exclusivamente produtos premium,
                removedores especiais para manchas difíceis e solventes profissionais que fazem a
                diferença no resultado final.
              </p>
              <p className="text-gray-500 leading-relaxed mb-8 text-sm">
                Oferecemos total flexibilidade de horários e personalização dos serviços — seja
                para manutenções rotineiras, limpezas pós-obra ou higienização especializada de
                estofados e colchões.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href="#orcamento" className="btn-primary text-center">
                  Solicitar orçamento
                </a>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-whatsapp"
                >
                  <WhatsAppIcon />
                  WhatsApp
                </a>
              </div>
            </div>

            <div className="flex justify-center">
              <div className="relative">
                <div className="w-72 h-72 bg-brand-light rounded-3xl flex items-center justify-center">
                  <Image
                    src="/logo.png"
                    alt="SOS Diaristas"
                    width={280}
                    height={200}
                    className="w-56 h-auto"
                  />
                </div>
                <div className="absolute -bottom-4 -right-4 bg-brand-blue text-white rounded-2xl px-6 py-4 shadow-xl">
                  <div className="text-3xl font-extrabold">+10</div>
                  <div className="text-xs text-blue-200 font-medium mt-0.5">anos de atuação</div>
                </div>
                <div className="absolute -top-4 -left-4 bg-white text-brand-navy rounded-2xl px-5 py-3 shadow-lg border border-gray-100">
                  <div className="text-2xl font-extrabold text-brand-blue">+500</div>
                  <div className="text-xs text-gray-400 font-medium mt-0.5">clientes satisfeitos</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTATO ──────────────────────────────────────────────────────── */}
      <section id="contato" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <span className="inline-block bg-brand-light text-brand-blue font-semibold text-xs uppercase tracking-widest px-4 py-2 rounded-full mb-4">
              Fale conosco
            </span>
            <h2 className="section-title">Entre em Contato</h2>
            <p className="text-gray-400 mt-4 text-sm">
              Estamos prontos para atender sua necessidade de limpeza
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 mb-10">
            {[
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ),
                title: 'Endereço',
                lines: ['Alameda Siriema, 73 – Vila A', 'Foz do Iguaçu – PR, 85866-240'],
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                ),
                title: 'WhatsApp',
                lines: ['(45) 99818-3986'],
                link: `https://wa.me/${WHATSAPP_NUMBER}`,
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                ),
                title: 'E-mail',
                lines: ['contato@sosdiaristas.com'],
                link: 'mailto:contato@sosdiaristas.com',
              },
            ].map((c) => (
              <div key={c.title} className="bg-white rounded-2xl p-6 border border-gray-100 text-center shadow-sm">
                <div className="w-11 h-11 bg-brand-light rounded-xl flex items-center justify-center text-brand-blue mx-auto mb-4">
                  {c.icon}
                </div>
                <h3 className="font-bold text-brand-navy mb-2 text-sm">{c.title}</h3>
                {c.lines.map((l) =>
                  c.link ? (
                    <a key={l} href={c.link} className="text-brand-blue hover:underline block text-sm">
                      {l}
                    </a>
                  ) : (
                    <p key={l} className="text-gray-500 text-sm">{l}</p>
                  )
                )}
              </div>
            ))}
          </div>

          <div className="rounded-2xl overflow-hidden shadow-sm h-64 border border-gray-100">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3600.0!2d-54.5898!3d-25.5478!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zQWxhbWVkYSBTaXJpZW1hLCA3MyAtIFZpbGEgQSwgRm96IGRvIElndWHDp3U!5e0!3m2!1spt!2sbr!4v1700000000000"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Localização SOS Diaristas"
            />
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────────────────── */}
      <section className="py-16 bg-green-500 text-white text-center relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="max-w-3xl mx-auto px-4 relative">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
            Pronto para ter uma casa impecável?
          </h2>
          <p className="text-green-100 text-base mb-8">
            Entre em contato agora e receba seu orçamento sem compromisso
          </p>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Olá! Vim pelo site e gostaria de solicitar um orçamento.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-white text-green-600 font-bold py-4 px-10 rounded-xl text-base hover:bg-green-50 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5"
          >
            <WhatsAppIcon color="currentColor" />
            Falar agora no WhatsApp
          </a>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="bg-brand-navy text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-10 mb-10">
            <div>
              <Image
                src="/logo.png"
                alt="SOS Diaristas"
                width={140}
                height={45}
                className="h-9 w-auto mb-4 brightness-0 invert"
              />
              <p className="text-blue-200 text-sm leading-relaxed">
                Empresa especializada em limpeza doméstica e empresarial em Foz do Iguaçu.
                Profissionais qualificados e produtos de alta qualidade.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-xs uppercase tracking-widest mb-4 text-white/60">
                Links Rápidos
              </h4>
              <ul className="space-y-2 text-blue-200 text-sm">
                {[
                  { label: 'Início', href: '#' },
                  { label: 'Serviços', href: '#servicos' },
                  { label: 'Sobre Nós', href: '#sobre' },
                  { label: 'Contato', href: '#contato' },
                  { label: 'Orçamento', href: '#orcamento' },
                ].map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="hover:text-white transition-colors">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-xs uppercase tracking-widest mb-4 text-white/60">
                Contato
              </h4>
              <ul className="space-y-2 text-blue-200 text-sm">
                <li>Alameda Siriema, 73 – Vila A</li>
                <li>Foz do Iguaçu – PR</li>
                <li>
                  <a href={`https://wa.me/${WHATSAPP_NUMBER}`} className="hover:text-white transition-colors">
                    (45) 99818-3986
                  </a>
                </li>
                <li>
                  <a href="mailto:contato@sosdiaristas.com" className="hover:text-white transition-colors">
                    contato@sosdiaristas.com
                  </a>
                </li>
                <li>
                  <a
                    href="https://instagram.com/sosdiaristass"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    @sosdiaristass
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-blue-200 text-xs">
            <p>© 2026 SOS Diaristas. Todos os direitos reservados.</p>
            <p>
              Desenvolvido por{' '}
              <span className="text-white font-medium">Gabriel Queiroz</span>
            </p>
          </div>
        </div>
      </footer>

      {/* ── BOTÃO FLUTUANTE WHATSAPP ──────────────────────────────────────── */}
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Olá! Vim pelo site e gostaria de um orçamento.')}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-110"
        aria-label="Falar no WhatsApp"
      >
        <WhatsAppIcon />
      </a>
    </main>
  )
}

function WhatsAppIcon({ color = 'white' }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={color}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  )
}
