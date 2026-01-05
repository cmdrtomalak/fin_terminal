"use strict";(()=>{function y(d){return d>=1e9?(d/1e9).toFixed(2)+"B":d>=1e6?(d/1e6).toFixed(2)+"M":d>=1e3?(d/1e3).toFixed(2)+"K":d.toString()}function g(d){return d>=1e12?"$"+(d/1e12).toFixed(2)+"T":d>=1e9?"$"+(d/1e9).toFixed(2)+"B":"$"+(d/1e6).toFixed(2)+"M"}function f(d){let e=new Date(d),t=new Date().getTime()-e.getTime(),i=Math.floor(t/(1e3*60*60));return i<1?"Just now":i<24?`${i}h ago`:e.toLocaleDateString()}function _(d){if(d==null||isNaN(d))return"\u2014";let e=Math.abs(d),a=d<0?"-":"";return e>=1e9?a+"$"+(e/1e9).toFixed(1)+"B":e>=1e6?a+"$"+(e/1e6).toFixed(1)+"M":e>=1e3?a+"$"+(e/1e3).toFixed(1)+"K":a+"$"+e.toFixed(0)}function E(d,e="number"){if(d==null||isNaN(d))return"N/A";switch(e){case"percent":return(d*100).toFixed(2)+"%";case"currency":return g(d);case"ratio":return d.toFixed(2);default:return y(d)}}function v(d){return d==null?"":d>=0?"positive":"negative"}var b=class{constructor(){this.treasuryChart=null;this.treasuryLineSeries=null;this.currentTreasuryMaturity=null;this.currentTreasuryDays=365;this.statementsData=null;this.currentTab="income";this.currentSymbol=null;this.chart=null;this.candleSeries=null;this.searchTimeout=null;this.selectedIndex=-1;this.searchResultsData=[];this.newsData=[];this.commandInput=document.getElementById("command-input"),this.searchResults=document.getElementById("search-results"),this.welcomeScreen=document.getElementById("welcome-screen"),this.securityView=document.getElementById("security-view"),this.tickerList=document.getElementById("ticker-list"),this.statusText=document.getElementById("status-text"),this.newsModal=document.getElementById("news-modal"),this.ratiosModal=document.getElementById("ratios-modal"),this.indexModal=document.getElementById("index-modal"),this.statementsModal=document.getElementById("statements-modal"),this.govtModal=document.getElementById("govt-modal"),this.treasuryChartModal=document.getElementById("treasury-chart-modal"),this.init()}init(){this.setupEventListeners(),this.setupModalListeners(),this.setupRatiosModal(),this.setupIndexModal(),this.setupStatementsModal(),this.setupGovtModal(),this.setupTreasuryChartModal(),this.updateTime(),this.loadQuickTickers(),setInterval(()=>this.updateTime(),1e3)}setupEventListeners(){this.commandInput.addEventListener("input",()=>this.handleSearch()),this.commandInput.addEventListener("keydown",e=>this.handleKeydown(e)),this.commandInput.addEventListener("focus",()=>{this.searchResultsData.length>0&&this.searchResults.classList.add("active")}),document.addEventListener("click",e=>{!this.commandInput.contains(e.target)&&!this.searchResults.contains(e.target)&&this.searchResults.classList.remove("active")}),document.querySelectorAll(".chart-btn").forEach(e=>{e.addEventListener("click",a=>{let t=a.target,i=parseInt(t.dataset.days||"90",10);document.querySelectorAll(".chart-btn").forEach(s=>s.classList.remove("active")),t.classList.add("active"),this.currentSymbol&&this.loadChartData(this.currentSymbol,i)})})}setupModalListeners(){let e=document.getElementById("modal-close"),a=this.newsModal.querySelector(".modal-overlay");e?.addEventListener("click",()=>this.closeModal()),a?.addEventListener("click",()=>this.closeModal()),document.addEventListener("keydown",t=>{t.key==="Escape"&&!this.newsModal.classList.contains("hidden")&&this.closeModal()})}openNewsModal(e){let a=document.getElementById("modal-title"),t=document.getElementById("modal-source"),i=document.getElementById("modal-timestamp"),s=document.getElementById("modal-sentiment"),m=document.getElementById("modal-body"),n=document.getElementById("modal-link");if(a&&(a.textContent=e.title),t&&(t.textContent=e.source),i&&(i.textContent=this.formatTime(e.timestamp)),s&&(s.textContent=e.sentiment,s.className=`modal-sentiment ${e.sentiment}`),m){let c=e.content||e.summary;m.innerHTML=c.split(`

`).map(o=>`<p>${o}</p>`).join("")}n&&(n.href=e.url),this.newsModal.classList.remove("hidden")}closeModal(){this.newsModal.classList.add("hidden")}setupRatiosModal(){let e=document.getElementById("ratios-btn"),a=document.getElementById("ratios-modal-close"),t=this.ratiosModal.querySelector(".modal-overlay");e?.addEventListener("click",()=>this.openRatiosModal()),a?.addEventListener("click",()=>this.closeRatiosModal()),t?.addEventListener("click",()=>this.closeRatiosModal()),document.addEventListener("keydown",i=>{i.key==="Escape"&&!this.ratiosModal.classList.contains("hidden")&&this.closeRatiosModal()})}async openRatiosModal(){if(!this.currentSymbol)return;let e=document.getElementById("ratios-loading"),a=document.getElementById("ratios-body"),t=document.getElementById("ratios-modal-title");t&&(t.textContent=`${this.currentSymbol} - Financial Ratios`),e&&(e.style.display="block"),a&&(a.innerHTML=""),this.ratiosModal.classList.remove("hidden");try{let i=await fetch(`/api/financials/${this.currentSymbol}`);if(!i.ok)throw new Error("Failed to fetch");let s=await i.json();this.renderRatios(s)}catch{a&&(a.innerHTML='<div class="ratios-loading">Failed to load financial data</div>')}finally{e&&(e.style.display="none")}}closeRatiosModal(){this.ratiosModal.classList.add("hidden")}renderRatios(e){let a=document.getElementById("ratios-body");if(!a)return;let t=(i,s="number")=>E(i,s);a.innerHTML=`
            <div class="ratios-section">
                <div class="ratios-section-title">VALUATION</div>
                <div class="ratio-row"><span class="ratio-label">P/E (TTM)</span><span class="ratio-value">${t(e.pe_ratio,"ratio")}</span></div>
                <div class="ratio-row"><span class="ratio-label">Forward P/E</span><span class="ratio-value">${t(e.forward_pe,"ratio")}</span></div>
                <div class="ratio-row"><span class="ratio-label">PEG Ratio</span><span class="ratio-value">${t(e.peg_ratio,"ratio")}</span></div>
                <div class="ratio-row"><span class="ratio-label">Price/Book</span><span class="ratio-value">${t(e.price_to_book,"ratio")}</span></div>
                <div class="ratio-row"><span class="ratio-label">Price/Sales</span><span class="ratio-value">${t(e.price_to_sales,"ratio")}</span></div>
                <div class="ratio-row"><span class="ratio-label">EV/Revenue</span><span class="ratio-value">${t(e.ev_to_revenue,"ratio")}</span></div>
                <div class="ratio-row"><span class="ratio-label">EV/EBITDA</span><span class="ratio-value">${t(e.ev_to_ebitda,"ratio")}</span></div>
            </div>

            <div class="ratios-section">
                <div class="ratios-section-title">PROFITABILITY</div>
                <div class="ratio-row"><span class="ratio-label">Profit Margin</span><span class="ratio-value ${v(e.profit_margin)}">${t(e.profit_margin,"percent")}</span></div>
                <div class="ratio-row"><span class="ratio-label">Operating Margin</span><span class="ratio-value ${v(e.operating_margin)}">${t(e.operating_margin,"percent")}</span></div>
                <div class="ratio-row"><span class="ratio-label">ROA</span><span class="ratio-value ${v(e.return_on_assets)}">${t(e.return_on_assets,"percent")}</span></div>
                <div class="ratio-row"><span class="ratio-label">ROE</span><span class="ratio-value ${v(e.return_on_equity)}">${t(e.return_on_equity,"percent")}</span></div>
                <div class="ratio-row"><span class="ratio-label">EPS (TTM)</span><span class="ratio-value">${t(e.eps,"ratio")}</span></div>
                <div class="ratio-row"><span class="ratio-label">EPS Forward</span><span class="ratio-value">${t(e.eps_forward,"ratio")}</span></div>
            </div>

            <div class="ratios-section">
                <div class="ratios-section-title">GROWTH</div>
                <div class="ratio-row"><span class="ratio-label">Revenue Growth (QoQ)</span><span class="ratio-value ${v(e.quarterly_revenue_growth)}">${t(e.quarterly_revenue_growth,"percent")}</span></div>
                <div class="ratio-row"><span class="ratio-label">Earnings Growth (QoQ)</span><span class="ratio-value ${v(e.quarterly_earnings_growth)}">${t(e.quarterly_earnings_growth,"percent")}</span></div>
            </div>

            <div class="ratios-section">
                <div class="ratios-section-title">INCOME STATEMENT</div>
                <div class="ratio-row"><span class="ratio-label">Revenue</span><span class="ratio-value">${t(e.revenue,"currency")}</span></div>
                <div class="ratio-row"><span class="ratio-label">Revenue/Share</span><span class="ratio-value">${t(e.revenue_per_share,"ratio")}</span></div>
                <div class="ratio-row"><span class="ratio-label">Gross Profit</span><span class="ratio-value">${t(e.gross_profit,"currency")}</span></div>
                <div class="ratio-row"><span class="ratio-label">EBITDA</span><span class="ratio-value">${t(e.ebitda,"currency")}</span></div>
                <div class="ratio-row"><span class="ratio-label">Net Income</span><span class="ratio-value">${t(e.net_income,"currency")}</span></div>
            </div>

            <div class="ratios-section">
                <div class="ratios-section-title">BALANCE SHEET</div>
                <div class="ratio-row"><span class="ratio-label">Total Cash</span><span class="ratio-value">${t(e.total_cash,"currency")}</span></div>
                <div class="ratio-row"><span class="ratio-label">Total Debt</span><span class="ratio-value">${t(e.total_debt,"currency")}</span></div>
                <div class="ratio-row"><span class="ratio-label">Debt/Equity</span><span class="ratio-value">${t(e.debt_to_equity,"ratio")}</span></div>
                <div class="ratio-row"><span class="ratio-label">Current Ratio</span><span class="ratio-value">${t(e.current_ratio,"ratio")}</span></div>
                <div class="ratio-row"><span class="ratio-label">Book Value</span><span class="ratio-value">${t(e.book_value,"ratio")}</span></div>
                <div class="ratio-row"><span class="ratio-label">Enterprise Value</span><span class="ratio-value">${t(e.enterprise_value,"currency")}</span></div>
            </div>

            <div class="ratios-section">
                <div class="ratios-section-title">CASH FLOW</div>
                <div class="ratio-row"><span class="ratio-label">Operating Cash Flow</span><span class="ratio-value">${t(e.operating_cash_flow,"currency")}</span></div>
                <div class="ratio-row"><span class="ratio-label">Free Cash Flow</span><span class="ratio-value">${t(e.free_cash_flow,"currency")}</span></div>
            </div>

            <div class="ratios-section">
                <div class="ratios-section-title">STOCK INFO</div>
                <div class="ratio-row"><span class="ratio-label">Beta</span><span class="ratio-value">${t(e.beta,"ratio")}</span></div>
                <div class="ratio-row"><span class="ratio-label">Shares Outstanding</span><span class="ratio-value">${t(e.shares_outstanding,"number")}</span></div>
                <div class="ratio-row"><span class="ratio-label">Float</span><span class="ratio-value">${t(e.float_shares,"number")}</span></div>
                <div class="ratio-row"><span class="ratio-label">Insider Ownership</span><span class="ratio-value">${t(e.held_by_insiders,"percent")}</span></div>
                <div class="ratio-row"><span class="ratio-label">Institutional Ownership</span><span class="ratio-value">${t(e.held_by_institutions,"percent")}</span></div>
                <div class="ratio-row"><span class="ratio-label">Short Ratio</span><span class="ratio-value">${t(e.short_ratio,"ratio")}</span></div>
            </div>

            <div class="ratios-section">
                <div class="ratios-section-title">DIVIDENDS</div>
                <div class="ratio-row"><span class="ratio-label">Dividend Rate</span><span class="ratio-value">${t(e.dividend_rate,"ratio")}</span></div>
                <div class="ratio-row"><span class="ratio-label">Dividend Yield</span><span class="ratio-value">${t(e.dividend_yield,"percent")}</span></div>
                <div class="ratio-row"><span class="ratio-label">Payout Ratio</span><span class="ratio-value">${t(e.payout_ratio,"percent")}</span></div>
            </div>
        `}setupIndexModal(){let e=document.querySelector('[data-fn="INDEX"]'),a=document.getElementById("index-modal-close"),t=this.indexModal.querySelector(".modal-overlay");e?.addEventListener("click",()=>this.openIndexModal()),a?.addEventListener("click",()=>this.closeIndexModal()),t?.addEventListener("click",()=>this.closeIndexModal()),document.addEventListener("keydown",i=>{i.key==="Escape"&&!this.indexModal.classList.contains("hidden")&&this.closeIndexModal()})}async openIndexModal(){let e=document.getElementById("index-loading"),a=document.getElementById("index-body");e&&(e.style.display="block"),a&&(a.innerHTML=""),this.indexModal.classList.remove("hidden");try{let t=await fetch("/api/indices");if(!t.ok)throw new Error("Failed to fetch");let i=await t.json();this.renderIndices(i)}catch{a&&(a.innerHTML='<div class="ratios-loading">Failed to load indices</div>')}finally{e&&(e.style.display="none")}}closeIndexModal(){this.indexModal.classList.add("hidden")}renderIndices(e){let a=document.getElementById("index-body");if(!a)return;let i=(n=>{let c=new Map,o=["US","UK","Germany","France","Europe","Netherlands","Spain","Italy","Switzerland","Japan","Hong Kong","China","Australia","South Korea","Taiwan","India","Singapore","Brazil","Mexico","Canada"];for(let r of o){let p=n.filter(h=>h.region===r);p.length>0&&c.set(r,p)}return c})(e),s="",m={US:"UNITED STATES",UK:"UNITED KINGDOM",Germany:"GERMANY",France:"FRANCE",Europe:"EUROPE",Netherlands:"NETHERLANDS",Spain:"SPAIN",Italy:"ITALY",Switzerland:"SWITZERLAND",Japan:"JAPAN","Hong Kong":"HONG KONG",China:"CHINA",Australia:"AUSTRALIA","South Korea":"SOUTH KOREA",Taiwan:"TAIWAN",India:"INDIA",Singapore:"SINGAPORE",Brazil:"BRAZIL",Mexico:"MEXICO",Canada:"CANADA"};i.forEach((n,c)=>{s+=`<div class="index-section">
                <div class="index-section-title">${m[c]||c}</div>`;for(let o of n){let r=o.change>=0?"positive":"negative",p=o.change>=0?"+":"";s+=`
                <div class="index-row">
                    <div class="index-info">
                        <span class="index-symbol">${o.symbol}</span>
                        <span class="index-name">${o.name}</span>
                    </div>
                    <div class="index-data">
                        <span class="index-price">${o.price.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
                        <span class="index-change ${r}">${p}${o.change.toFixed(2)}</span>
                        <span class="index-percent ${r}">${p}${o.change_percent.toFixed(2)}%</span>
                    </div>
                </div>`}s+="</div>"}),a.innerHTML=s}setupStatementsModal(){let e=document.getElementById("statements-btn"),a=document.getElementById("statements-modal-close"),t=this.statementsModal.querySelector(".modal-overlay");e?.addEventListener("click",()=>this.openStatementsModal()),a?.addEventListener("click",()=>this.closeStatementsModal()),t?.addEventListener("click",()=>this.closeStatementsModal()),this.statementsModal.querySelectorAll(".stmt-tab").forEach(i=>{i.addEventListener("click",s=>{let m=s.target,n=m.dataset.tab;this.currentTab=n,this.statementsModal.querySelectorAll(".stmt-tab").forEach(c=>c.classList.remove("active")),m.classList.add("active"),this.statementsData&&this.renderStatements(this.statementsData)})}),document.addEventListener("keydown",i=>{i.key==="Escape"&&!this.statementsModal.classList.contains("hidden")&&this.closeStatementsModal()})}setupGovtModal(){let e=document.querySelector('[data-fn="GOVT"]'),a=document.getElementById("govt-modal-close"),t=this.govtModal.querySelector(".modal-overlay");e?.addEventListener("click",()=>this.openGovtModal()),a?.addEventListener("click",()=>this.closeGovtModal()),t?.addEventListener("click",()=>this.closeGovtModal()),document.addEventListener("keydown",i=>{i.key==="Escape"&&!this.govtModal.classList.contains("hidden")&&this.closeGovtModal()})}async openGovtModal(){let e=document.getElementById("govt-loading"),a=document.getElementById("govt-body"),t=document.getElementById("govt-date");e&&(e.style.display="block"),a&&(a.innerHTML=""),this.govtModal.classList.remove("hidden");try{let i=await fetch("/api/treasury");if(!i.ok)throw new Error("Failed to fetch");let s=await i.json();t&&(t.textContent=`As of ${s.date}`),this.renderTreasury(s)}catch{a&&(a.innerHTML='<div class="ratios-loading">Failed to load treasury rates</div>')}finally{e&&(e.style.display="none")}}closeGovtModal(){this.govtModal.classList.add("hidden")}renderTreasury(e){let a=document.getElementById("govt-body");if(!a)return;let t=e.rates.filter(o=>["1 Mo","1.5 Month","2 Mo","3 Mo","4 Mo","6 Mo"].includes(o.maturity)),i=e.rates.filter(o=>["1 Yr","2 Yr","3 Yr","5 Yr","7 Yr","10 Yr","20 Yr","30 Yr"].includes(o.maturity)),s=o=>{let r=o.change>=0?"positive":"negative",p=o.change>=0?"+":"";return`
                <div class="treasury-row">
                    <span class="treasury-maturity">${o.maturity}</span>
                    <span class="treasury-yield">${o.yield_rate.toFixed(2)}%</span>
                    <span class="treasury-change ${r}">${p}${o.change.toFixed(2)}</span>
                    <span class="treasury-pct ${r}">${p}${o.change_percent.toFixed(2)}%</span>
                </div>
            `},m="";t.length>0&&(m+=`
                <div class="treasury-section">
                    <div class="treasury-section-title">SHORT-TERM (BILLS)</div>
                    <div class="treasury-header">
                        <span>Maturity</span>
                        <span>Yield</span>
                        <span>Chg</span>
                        <span>Chg %</span>
                    </div>
                    ${t.map(s).join("")}
                </div>
            `),i.length>0&&(m+=`
                <div class="treasury-section">
                    <div class="treasury-section-title">LONG-TERM (NOTES & BONDS)</div>
                    <div class="treasury-header">
                        <span>Maturity</span>
                        <span>Yield</span>
                        <span>Chg</span>
                        <span>Chg %</span>
                    </div>
                    ${i.map(s).join("")}
                </div>
            `);let n=e.rates.find(o=>o.maturity==="10 Yr"),c=e.rates.find(o=>o.maturity==="2 Yr");if(n&&c){let o=n.yield_rate-c.yield_rate,r=o>=0?"positive":"negative";m+=`
                <div class="treasury-section">
                    <div class="treasury-section-title">YIELD CURVE</div>
                    <div class="treasury-row">
                        <span class="treasury-maturity">10Y-2Y Spread</span>
                        <span class="treasury-yield ${r}">${o>=0?"+":""}${(o*100).toFixed(0)} bps</span>
                        <span class="treasury-change"></span>
                        <span class="treasury-pct"></span>
                    </div>
                </div>
            `}m+=`<div class="treasury-updated">Last updated: ${new Date(e.updated_at).toLocaleString()}</div>`,a.innerHTML=m,a.querySelectorAll(".treasury-row").forEach(o=>{let r=o.querySelector(".treasury-maturity");if(r){let p=r.textContent;p&&!p.includes("Spread")&&(o.classList.add("clickable"),o.addEventListener("click",()=>this.openTreasuryChartModal(p)))}})}setupTreasuryChartModal(){let e=document.getElementById("treasury-chart-modal-close"),a=this.treasuryChartModal.querySelector(".modal-overlay");e?.addEventListener("click",()=>this.closeTreasuryChartModal()),a?.addEventListener("click",()=>this.closeTreasuryChartModal()),document.addEventListener("keydown",t=>{t.key==="Escape"&&!this.treasuryChartModal.classList.contains("hidden")&&this.closeTreasuryChartModal()}),this.treasuryChartModal.querySelectorAll(".treasury-range-btn").forEach(t=>{t.addEventListener("click",i=>{let s=i.target,m=parseInt(s.dataset.days||"365",10);this.treasuryChartModal.querySelectorAll(".treasury-range-btn").forEach(n=>n.classList.remove("active")),s.classList.add("active"),this.currentTreasuryDays=m,this.currentTreasuryMaturity&&this.loadTreasuryHistory(this.currentTreasuryMaturity,m)})})}async openTreasuryChartModal(e){this.currentTreasuryMaturity=e,this.currentTreasuryDays=365;let a=document.getElementById("treasury-chart-title"),t=document.getElementById("treasury-chart-loading"),i=document.getElementById("treasury-chart-container");a&&(a.textContent=`${e} Treasury Yield History`),t&&(t.style.display="block"),i&&(i.innerHTML=""),this.treasuryChartModal.querySelectorAll(".treasury-range-btn").forEach(s=>{s.classList.toggle("active",s.getAttribute("data-days")==="365")}),this.treasuryChartModal.classList.remove("hidden"),await this.loadTreasuryHistory(e,365)}closeTreasuryChartModal(){this.treasuryChartModal.classList.add("hidden"),this.treasuryChart&&(this.treasuryChart.remove(),this.treasuryChart=null,this.treasuryLineSeries=null),this.currentTreasuryMaturity=null}async loadTreasuryHistory(e,a){let t=document.getElementById("treasury-chart-loading"),i=document.getElementById("treasury-chart-container");t&&(t.style.display="block");try{let s=encodeURIComponent(e),m=await fetch(`/api/treasury/history/${s}?days=${a}`);if(!m.ok)throw new Error("Failed to fetch treasury history");let n=await m.json();this.renderTreasuryChart(n)}catch{i&&(i.innerHTML='<div class="ratios-loading">Failed to load treasury history</div>')}finally{t&&(t.style.display="none")}}renderTreasuryChart(e){let a=document.getElementById("treasury-chart-container");if(!a)return;if(this.treasuryChart&&(this.treasuryChart.remove(),this.treasuryChart=null,this.treasuryLineSeries=null),a.innerHTML="",e.points.length===0){a.innerHTML='<div class="ratios-loading">No historical data available</div>';return}this.treasuryChart=LightweightCharts.createChart(a,{width:a.clientWidth,height:400,layout:{background:{color:"#1a1a1a"},textColor:"#ff9900"},grid:{vertLines:{color:"rgba(255, 153, 0, 0.1)"},horzLines:{color:"rgba(255, 153, 0, 0.1)"}},crosshair:{mode:LightweightCharts.CrosshairMode.Normal},rightPriceScale:{borderColor:"rgba(255, 153, 0, 0.3)"},timeScale:{borderColor:"rgba(255, 153, 0, 0.3)",timeVisible:!0,secondsVisible:!1}}),this.treasuryLineSeries=this.treasuryChart.addLineSeries({color:"#ff9900",lineWidth:2,crosshairMarkerVisible:!0,crosshairMarkerRadius:4,priceFormat:{type:"price",precision:2,minMove:.01}});let t=e.points.map(s=>({time:s.date,value:s.yield_rate}));this.treasuryLineSeries.setData(t),this.treasuryChart.timeScale().fitContent(),new ResizeObserver(()=>{this.treasuryChart&&a&&this.treasuryChart.applyOptions({width:a.clientWidth})}).observe(a)}async openStatementsModal(){if(!this.currentSymbol)return;let e=document.getElementById("statements-loading"),a=document.getElementById("statements-body"),t=document.getElementById("statements-modal-title");t&&(t.textContent=`${this.currentSymbol} - Financial Statements`),e&&(e.style.display="block"),a&&(a.innerHTML=""),this.statementsModal.classList.remove("hidden");try{let i=await fetch(`/api/statements/${this.currentSymbol}`);if(!i.ok)throw new Error("Failed to fetch");this.statementsData=await i.json(),this.renderStatements(this.statementsData)}catch{a&&(a.innerHTML='<div class="ratios-loading">Failed to load financial statements</div>')}finally{e&&(e.style.display="none")}}closeStatementsModal(){this.statementsModal.classList.add("hidden")}renderStatements(e){let a=document.getElementById("statements-body");if(!a)return;let t=n=>_(n),i=n=>n.some(c=>c!=null&&c!==0),s=(n,c,o=!1)=>i(c)?`<tr${o?' class="stmt-highlight"':""}><td>${n}</td>${c.map(p=>`<td class="${v(p)}">${t(p)}</td>`).join("")}</tr>`:"",m="";if(this.currentTab==="income"){let n=e.income_statements;if(n.length===0)m='<div class="ratios-loading">No income statement data available</div>';else{let c=n.map(r=>r.fiscal_year.split("-")[0]||r.fiscal_year),o=[s("Total Revenue",n.map(r=>r.total_revenue),!0),s("Cost of Revenue",n.map(r=>r.cost_of_revenue)),s("Gross Profit",n.map(r=>r.gross_profit),!0),s("R&D Expenses",n.map(r=>r.research_development)),s("SG&A Expenses",n.map(r=>r.selling_general_admin)),s("Total Operating Expenses",n.map(r=>r.total_operating_expenses)),s("Operating Income",n.map(r=>r.operating_income),!0),s("Interest Expense",n.map(r=>r.interest_expense)),s("Income Before Tax",n.map(r=>r.income_before_tax)),s("Income Tax Expense",n.map(r=>r.income_tax_expense)),s("Net Income",n.map(r=>r.net_income),!0),s("EBIT",n.map(r=>r.ebit)),s("EBITDA",n.map(r=>r.ebitda))].filter(r=>r).join("");m=`
                    <table class="statements-table">
                        <thead>
                            <tr>
                                <th class="stmt-label-col">Item</th>
                                ${c.map(r=>`<th class="stmt-value-col">${r}</th>`).join("")}
                            </tr>
                        </thead>
                        <tbody>${o}</tbody>
                    </table>
                `}}else if(this.currentTab==="balance"){let n=e.balance_sheets;if(n.length===0)m='<div class="ratios-loading">No balance sheet data available</div>';else{let c=n.map(l=>l.fiscal_year.split("-")[0]||l.fiscal_year),o=[s("Cash & Equivalents",n.map(l=>l.cash_and_equivalents)),s("Short-term Investments",n.map(l=>l.short_term_investments)),s("Accounts Receivable",n.map(l=>l.accounts_receivable)),s("Inventory",n.map(l=>l.inventory)),s("Total Current Assets",n.map(l=>l.total_current_assets),!0),s("Property, Plant & Equipment",n.map(l=>l.property_plant_equipment)),s("Goodwill",n.map(l=>l.goodwill)),s("Intangible Assets",n.map(l=>l.intangible_assets)),s("Total Assets",n.map(l=>l.total_assets),!0)].filter(l=>l).join(""),r=[s("Accounts Payable",n.map(l=>l.accounts_payable)),s("Short-term Debt",n.map(l=>l.short_term_debt)),s("Total Current Liabilities",n.map(l=>l.total_current_liabilities),!0),s("Long-term Debt",n.map(l=>l.long_term_debt)),s("Total Liabilities",n.map(l=>l.total_liabilities),!0)].filter(l=>l).join(""),p=[s("Common Stock",n.map(l=>l.common_stock)),s("Retained Earnings",n.map(l=>l.retained_earnings)),s("Total Stockholders Equity",n.map(l=>l.total_stockholders_equity),!0)].filter(l=>l).join(""),h="";o&&(h+=`<tr class="stmt-section-header"><td colspan="${c.length+1}">ASSETS</td></tr>${o}`),r&&(h+=`<tr class="stmt-section-header"><td colspan="${c.length+1}">LIABILITIES</td></tr>${r}`),p&&(h+=`<tr class="stmt-section-header"><td colspan="${c.length+1}">EQUITY</td></tr>${p}`),h?m=`
                        <table class="statements-table">
                            <thead>
                                <tr>
                                    <th class="stmt-label-col">Item</th>
                                    ${c.map(l=>`<th class="stmt-value-col">${l}</th>`).join("")}
                                </tr>
                            </thead>
                            <tbody>${h}</tbody>
                        </table>
                    `:m='<div class="ratios-loading">No balance sheet data available</div>'}}else if(this.currentTab==="cashflow"){let n=e.cash_flows;if(n.length===0)m='<div class="ratios-loading">No cash flow data available</div>';else{let c=n.map(u=>u.fiscal_year.split("-")[0]||u.fiscal_year),o=[s("Net Income",n.map(u=>u.net_income)),s("Depreciation",n.map(u=>u.depreciation)),s("Change in Working Capital",n.map(u=>u.change_in_working_capital)),s("Operating Cash Flow",n.map(u=>u.operating_cash_flow),!0)].filter(u=>u).join(""),r=[s("Capital Expenditures",n.map(u=>u.capital_expenditures)),s("Investments",n.map(u=>u.investments)),s("Investing Cash Flow",n.map(u=>u.investing_cash_flow),!0)].filter(u=>u).join(""),p=[s("Dividends Paid",n.map(u=>u.dividends_paid)),s("Stock Repurchases",n.map(u=>u.stock_repurchases)),s("Debt Repayment",n.map(u=>u.debt_repayment)),s("Financing Cash Flow",n.map(u=>u.financing_cash_flow),!0)].filter(u=>u).join(""),h=s("Free Cash Flow",n.map(u=>u.free_cash_flow),!0),l="";o&&(l+=`<tr class="stmt-section-header"><td colspan="${c.length+1}">OPERATING ACTIVITIES</td></tr>${o}`),r&&(l+=`<tr class="stmt-section-header"><td colspan="${c.length+1}">INVESTING ACTIVITIES</td></tr>${r}`),p&&(l+=`<tr class="stmt-section-header"><td colspan="${c.length+1}">FINANCING ACTIVITIES</td></tr>${p}`),h&&(l+=`<tr class="stmt-section-header"><td colspan="${c.length+1}">FREE CASH FLOW</td></tr>${h}`),l?m=`
                        <table class="statements-table">
                            <thead>
                                <tr>
                                    <th class="stmt-label-col">Item</th>
                                    ${c.map(u=>`<th class="stmt-value-col">${u}</th>`).join("")}
                                </tr>
                            </thead>
                            <tbody>${l}</tbody>
                        </table>
                    `:m='<div class="ratios-loading">No cash flow data available</div>'}}a.innerHTML=m}handleKeydown(e){let a=this.searchResults.querySelectorAll(".search-item");e.key==="ArrowDown"?(e.preventDefault(),this.selectedIndex=Math.min(this.selectedIndex+1,a.length-1),this.updateSelectedItem(a)):e.key==="ArrowUp"?(e.preventDefault(),this.selectedIndex=Math.max(this.selectedIndex-1,-1),this.updateSelectedItem(a)):e.key==="Enter"?(e.preventDefault(),this.selectedIndex>=0&&this.searchResultsData[this.selectedIndex]?this.selectCompany(this.searchResultsData[this.selectedIndex]):this.searchResultsData.length>0&&this.selectCompany(this.searchResultsData[0])):e.key==="Escape"&&(this.searchResults.classList.remove("active"),this.selectedIndex=-1)}updateSelectedItem(e){e.forEach((a,t)=>{a.classList.toggle("selected",t===this.selectedIndex)})}async handleSearch(){let e=this.commandInput.value.trim();if(this.searchTimeout&&clearTimeout(this.searchTimeout),e.length<1){this.searchResults.classList.remove("active"),this.searchResultsData=[];return}this.searchTimeout=window.setTimeout(async()=>{this.setStatus("SEARCHING...");try{let t=await(await fetch(`/api/search?q=${encodeURIComponent(e)}`)).json();this.searchResultsData=t,this.selectedIndex=-1,this.renderSearchResults(t),this.setStatus("READY")}catch{this.setStatus("ERROR")}},150)}renderSearchResults(e){if(e.length===0){this.searchResults.innerHTML='<div class="search-item">No results found</div>',this.searchResults.classList.add("active");return}this.searchResults.innerHTML=e.map((a,t)=>`
            <div class="search-item" data-index="${t}">
                <span class="symbol">${a.symbol}</span>
                <span class="name">${a.name}</span>
            </div>
        `).join(""),this.searchResults.querySelectorAll(".search-item").forEach(a=>{a.addEventListener("click",()=>{let t=parseInt(a.dataset.index||"0",10);this.selectCompany(e[t])})}),this.searchResults.classList.add("active")}selectCompany(e){this.currentSymbol=e.symbol,this.commandInput.value=e.symbol,this.searchResults.classList.remove("active"),this.loadSecurityView(e)}async loadSecurityView(e){this.setStatus("LOADING..."),this.welcomeScreen.classList.add("hidden"),this.securityView.classList.remove("hidden"),await Promise.all([this.loadQuote(e.symbol),this.loadChartData(e.symbol,30),this.loadNews(e.symbol)]),this.renderDescription(e),this.setStatus("READY")}async loadQuote(e){try{let t=await(await fetch(`/api/quote/${e}`)).json();this.renderQuote(t)}catch{console.error("Failed to load quote")}}renderQuote(e){let a=document.getElementById("quote-symbol"),t=document.getElementById("quote-name"),i=document.getElementById("quote-exchange"),s=document.getElementById("quote-price"),m=document.getElementById("quote-change"),n=document.getElementById("quote-details");if(a&&(a.textContent=e.symbol),t&&(t.textContent=e.name),i&&(i.textContent=`\u2022 ${e.symbol.includes(".")?"LSE":"NASDAQ"}`),s&&(s.textContent=e.price.toFixed(2)),m){let c=e.change>=0?"+":"";m.textContent=`${c}${e.change.toFixed(2)} (${c}${e.change_percent.toFixed(2)}%)`,m.className=`change ${e.change>=0?"positive":"negative"}`}n&&(n.innerHTML=`
                <div class="quote-row"><span class="label">Open</span><span class="value">${e.open.toFixed(2)}</span></div>
                <div class="quote-row"><span class="label">High</span><span class="value">${e.high.toFixed(2)}</span></div>
                <div class="quote-row"><span class="label">Low</span><span class="value">${e.low.toFixed(2)}</span></div>
                <div class="quote-row"><span class="label">Volume</span><span class="value">${this.formatNumber(e.volume)}</span></div>
                <div class="quote-row"><span class="label">Mkt Cap</span><span class="value">${this.formatMarketCap(e.market_cap)}</span></div>
                <div class="quote-row"><span class="label">P/E</span><span class="value">${e.pe_ratio?.toFixed(2)||"N/A"}</span></div>
                <div class="quote-row"><span class="label">EPS</span><span class="value">${e.eps?.toFixed(2)||"N/A"}</span></div>
                <div class="quote-row"><span class="label">Div Yield</span><span class="value">${e.dividend_yield?e.dividend_yield.toFixed(2)+"%":"N/A"}</span></div>
                <div class="quote-row"><span class="label">52W High</span><span class="value">${e.week_52_high.toFixed(2)}</span></div>
                <div class="quote-row"><span class="label">52W Low</span><span class="value">${e.week_52_low.toFixed(2)}</span></div>
                <div class="quote-row"><span class="label">Avg Vol</span><span class="value">${this.formatNumber(e.avg_volume)}</span></div>
            `)}async loadChartData(e,a){try{let i=await(await fetch(`/api/chart/${e}?days=${a}`)).json();this.renderChart(i)}catch{console.error("Failed to load chart data")}}renderChart(e){let a=document.getElementById("chart-container");if(!a)return;this.chart&&this.chart.remove(),this.chart=LightweightCharts.createChart(a,{width:a.clientWidth,height:a.clientHeight,layout:{background:{color:"#111111"},textColor:"#888888"},grid:{vertLines:{color:"#222222"},horzLines:{color:"#222222"}},crosshair:{mode:LightweightCharts.CrosshairMode.Normal},rightPriceScale:{borderColor:"#333333"},timeScale:{borderColor:"#333333",timeVisible:!0}}),this.candleSeries=this.chart.addCandlestickSeries({upColor:"#00ff00",downColor:"#ff3333",borderUpColor:"#00ff00",borderDownColor:"#ff3333",wickUpColor:"#00ff00",wickDownColor:"#ff3333"});let t=e.points.map(s=>({time:s.timestamp,open:s.open,high:s.high,low:s.low,close:s.close}));this.candleSeries.setData(t),this.chart.timeScale().fitContent(),new ResizeObserver(()=>{this.chart&&a&&this.chart.applyOptions({width:a.clientWidth,height:a.clientHeight})}).observe(a)}async loadNews(e){try{let t=await(await fetch(`/api/news/${e}`)).json();this.renderNews(t)}catch{console.error("Failed to load news")}}renderNews(e){let a=document.getElementById("news-feed");a&&(this.newsData=e.items,a.innerHTML=e.items.map((t,i)=>`
            <div class="news-item">
                <div class="headline" data-news-index="${i}">${t.title}</div>
                <div class="meta">
                    <span>${t.source}</span>
                    <span>${this.formatTime(t.timestamp)}</span>
                    <span class="sentiment ${t.sentiment}">${t.sentiment.toUpperCase()}</span>
                </div>
            </div>
        `).join(""),a.querySelectorAll(".headline").forEach(t=>{t.addEventListener("click",()=>{let i=parseInt(t.dataset.newsIndex||"0",10);this.newsData[i]&&this.openNewsModal(this.newsData[i])})}))}renderDescription(e){let a=document.getElementById("company-description");a&&(a.innerHTML=`
                <p><strong>Sector:</strong> ${e.sector}</p>
                <p><strong>Industry:</strong> ${e.industry}</p>
                <p>${e.description}</p>
            `)}loadQuickTickers(){let e=["AAPL","MSFT","GOOGL","AMZN","NVDA","META","TSLA"];this.tickerList.innerHTML=e.map(a=>`<div class="ticker-item" data-symbol="${a}">${a}</div>`).join(""),this.tickerList.querySelectorAll(".ticker-item").forEach(a=>{a.addEventListener("click",async()=>{let t=a.dataset.symbol;if(t){this.commandInput.value=t;let s=await(await fetch(`/api/search?q=${t}`)).json();s.length>0&&this.selectCompany(s[0])}})})}updateTime(){let e=document.getElementById("current-time");if(e){let a=new Date;e.textContent=a.toLocaleTimeString("en-US",{hour12:!1,hour:"2-digit",minute:"2-digit",second:"2-digit"})}}setStatus(e){this.statusText.textContent=e}formatNumber(e){return y(e)}formatMarketCap(e){return g(e)}formatTime(e){return f(e)}};document.addEventListener("DOMContentLoaded",()=>{new b});})();
