import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans" style={{ WebkitFontSmoothing: 'antialiased' }}>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fustat:wght@700&family=Inter:wght@400;500;600&display=swap');
        .font-fustat { font-family: 'Fustat', sans-serif; }
        .font-inter  { font-family: 'Inter', sans-serif; }
      `}</style>

      {/* Background glow blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div style={{ position:'absolute', top:'-120px', left:'-80px', width:'520px', height:'520px', background:'radial-gradient(ellipse, rgba(96,177,255,0.28) 0%, transparent 70%)', filter:'blur(40px)' }} />
        <div style={{ position:'absolute', top:'-60px', left:'60px', width:'320px', height:'320px', background:'radial-gradient(ellipse, rgba(49,154,255,0.18) 0%, transparent 70%)', filter:'blur(60px)' }} />
      </div>

      {/* Sticky Navbar */}
      <div className="sticky z-50" style={{ top:'30px', display:'flex', justifyContent:'center' }}>
        <nav style={{
          backdropFilter:'blur(50px)', WebkitBackdropFilter:'blur(50px)',
          background:'rgba(255,255,255,0.3)', borderRadius:'16px',
          border:'1px solid rgba(0,0,0,0.1)',
          boxShadow:'inset 0px 4px 4px 0px rgba(255,255,255,0.25)',
          padding:'10px 24px', display:'flex', alignItems:'center', gap:'32px',
        }}>
          <span className="font-fustat font-bold text-gray-900 text-lg tracking-tight">Taskly</span>
          <div className="hidden md:flex items-center gap-6">
            {['Home','Features','Company','Pricing'].map(l => (
              <a key={l} href="#" className="font-inter text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">{l}</a>
            ))}
          </div>
          <Link to="/register" style={{
            background:'rgba(255,255,255,0.5)', backdropFilter:'blur(8px)',
            border:'1px solid rgba(0,0,0,0.1)', borderRadius:'10px',
            padding:'7px 16px', display:'flex', alignItems:'center', gap:'6px',
            boxShadow:'inset 0px 2px 3px rgba(255,255,255,0.4)',
          }} className="font-inter text-sm font-semibold text-gray-800 hover:bg-white/70 transition-all">
            SignUp
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </Link>
        </nav>
      </div>

      {/* Hero */}
      <div className="relative z-10 max-w-[1600px] mx-auto px-6 pt-24 pb-16">
        <div className="flex flex-col lg:flex-row items-center gap-12">

          {/* Left */}
          <div className="flex-1 max-w-xl">
            {/* Social proof */}
            <div className="inline-flex items-center gap-2 bg-white/80 border border-gray-200 rounded-full px-4 py-2 mb-8 shadow-sm">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_,i) => (
                  <svg key={i} className="w-4 h-4" style={{color:'#FF801E'}} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                ))}
              </div>
              <span className="font-inter text-sm font-medium text-gray-700">Rated 4.9/5 by 2700+ customers</span>
            </div>

            {/* Headline */}
            <h1 className="font-fustat font-bold text-gray-900 mb-6" style={{ fontSize:'clamp(42px,5vw,75px)', lineHeight:'1.05', letterSpacing:'-2px' }}>
              Work smarter,<br />achieve faster
            </h1>

            {/* Sub */}
            <p className="font-inter text-gray-600 mb-10 max-w-md" style={{ fontSize:'18px', letterSpacing:'-1px', lineHeight:'1.7' }}>
              Effortlessly manage your projects, collaborate with your team, and achieve your goals with our intuitive task management tool.
            </p>

            {/* CTA */}
            <Link to="/register" style={{
              display:'inline-flex', alignItems:'center', gap:'10px',
              background:'rgba(0,132,255,0.8)', backdropFilter:'blur(2px)',
              borderRadius:'16px', padding:'14px 28px',
              boxShadow:'inset 0px 4px 4px 0px rgba(255,255,255,0.35)',
              transition:'transform 0.2s ease',
            }}
              onMouseEnter={e => e.currentTarget.style.transform='scale(1.02)'}
              onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
              className="font-inter font-semibold text-white text-base">
              Get Started Now
              <div style={{ width:'28px', height:'28px', background:'white', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </div>
            </Link>

            {/* Trusted logos */}
            <div className="mt-16">
              <p className="font-inter text-xs font-medium text-gray-400 uppercase tracking-widest mb-6">Trusted by Top-tier product companies</p>
              <div className="flex flex-wrap items-center gap-10 opacity-40">
                {[
                  <svg key="a" width="80" height="24" viewBox="0 0 80 24" fill="none"><rect width="80" height="8" rx="4" fill="#374151"/><rect y="16" width="60" height="8" rx="4" fill="#374151"/></svg>,
                  <svg key="b" width="70" height="24" viewBox="0 0 70 24" fill="none"><circle cx="12" cy="12" r="12" fill="#374151"/><rect x="30" y="4" width="40" height="8" rx="4" fill="#374151"/><rect x="30" y="16" width="28" height="4" rx="2" fill="#374151"/></svg>,
                  <svg key="c" width="90" height="20" viewBox="0 0 90 20" fill="none"><rect width="90" height="7" rx="3.5" fill="#374151"/><rect y="13" width="65" height="7" rx="3.5" fill="#374151"/></svg>,
                  <svg key="d" width="75" height="28" viewBox="0 0 75 28" fill="none"><rect x="0" y="4" width="20" height="20" rx="5" fill="#374151"/><rect x="28" y="0" width="47" height="10" rx="5" fill="#374151"/><rect x="28" y="18" width="33" height="10" rx="5" fill="#374151"/></svg>,
                  <svg key="e" width="85" height="22" viewBox="0 0 85 22" fill="none"><ellipse cx="11" cy="11" rx="11" ry="11" fill="#374151"/><rect x="28" y="2" width="57" height="8" rx="4" fill="#374151"/><rect x="28" y="14" width="40" height="6" rx="3" fill="#374151"/></svg>,
                ]}
              </div>
            </div>
          </div>

          {/* Right — Glassy Orb */}
          <div className="flex-1 flex items-center justify-center relative lg:block hidden">
            <div style={{ position:'relative', width:'600px', height:'600px', overflow:'visible' }}>
              <video autoPlay loop muted playsInline
                style={{
                  width:'100%', height:'100%', objectFit:'cover',
                  transform:'scale(1.25)', transformOrigin:'center',
                  mixBlendMode:'screen',
                  filter:'hue-rotate(-55deg) saturate(250%) brightness(1.2) contrast(1.1)',
                }}>
                <source src="https://future.co/images/homepage/glassy-orb/orb-purple.webm" type="video/webm" />
              </video>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
