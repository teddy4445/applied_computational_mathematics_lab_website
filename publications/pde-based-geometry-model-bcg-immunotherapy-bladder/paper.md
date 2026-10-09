## 1. Introduction and related work

Bladder cancer (BC) is the 10th most common form of cancer worldwide, with an estimated 549,000 new cases and 200,000 deaths. The highest incidence occurs in industrialized and developed areas, such as Europe, North America, and Australia (Bray et al., 2018). The primary cause of about half of bladder cancer cases is occupational exposure to chemicals in industrial areas processing paints, metals, dyes and petroleum products. Tobacco smoking and environmental carcinogens are another risk factor for bladder cancer (Bunimovich-Mendrazitsky et al., 2015a). The high rates of recurrence, invasive surveillance strategies, and high treatment costs combine to make bladder cancer the single most expensive cancer in both England and the United States (Eylert et al., 2014).

Treatment of non-invasive BC has not advanced significantly over the past few decades following the treatment protocol suggested by Morales et al. (1976) that involves weekly instillations of Bacillus Calmette–Gu´erin (BCG) (Morales et al., 1976). BCG, an attenuated non-pathogenic strain of Mycobacterium bovis that was originally used as a vaccine against tuberculosis (TB), is a type of immunotherapy used to treat non-invasive bladder cancer (Herr et al., 1988; Simon et al., 2008; Redelman-Sidi et al., 2014). BCG immunotherapy has proven superior to chemotherapy in reducing the rate of tumor relapse (Wei, 2016). Although Lamm and others have found that BCG even reduces the progression of the disease (Lamm, 2006), it is necessary to understand why the standard BCG treatment protocol is not effective for non-responding or relapsing patients. The BCG treatment protocol has yet to be optimized specifically for those patients who do not achieve remission from treatment according to the standard scheme.

Mathematical modeling shown to be a useful tool in oncology, allowing to investigate both the disease and possible treatments (Bhattacharya et al., 2020; Jord˜ao and Tavares, 2017; Hornberg et al., 2006). Several attempts have been made to develop the model for BCG treatment of BC as a response of the immune system to introduced bacteria into the bladder by means of Ordinary Differential Equations (ODE) in order to find the optimal treatment protocol (Shaikhet and Bunimovich-Mendrazitsky, 2018; Bunimovich-Mendrazitsky and Goltser, 2011; Bunimovich-Mendrazitsky et al., 2015b). In addition, several attempts were made to describe the cell dynamics taking into account biological interactions in the physical space based on partial differential equations (PDE) (Lazebnik et al., 2020; Matzavinos et al., 2004; Eikenberry et al., 2009; Fridman and Kao, 2014). One of them is the model is investigated by Fridman et al. (Fridman and Kao, 2014) which describes the case where the geometrical configuration is a sphere. The model describes the cell population dynamics including the immune system cells, cancer cells, healthy cells and disease-infected cells. Their model (Fridman and Kao, 2014) analyzes both logistic and exponential growth of tumor cells.

Another model describing BCG immunotherapy treatment dynamics that takes into consideration an approximation of the bladder’s geometry using PDE investigated by Lazebnik et al. (2020). Their model (Lazebnik et al., 2020) assumed continuous BCG instillation and logistic growth of tumor cells inside the bladder. In (Lazebnik et al., 2020) the changes in treatment protocol were studied by considering a sphere-ring approximation to the bladder’s geometry. Moreover, in this model a diffusion dynamics was added for all cell populations as BCG, tumor and effector cells. The model from (Lazebnik et al., 2020) suffered from numerical instability for long treatment time: cancer cell population shows divergence to infinity at the 35th day of the treatment.

In the research of Guzev et al. (2019) a BCG and interleukin 2 (IL-2) combined therapy was examined and presented validation of this protocol for BC patients (Guzev et al., 2019). However, the model from (Guzev et al., 2019) is lacking the geometrical understanding of the dynamics of the biological system and diffusion of cell population during therapy.

There are medical and biological investigations that show the prognostic significance of tumor location on survival outcomes in patients with BC (Grabnar et al., 2006; Weiner et al., 2019). Therefore, in order to obtain the best treatment protocol, it is important to consider the geometry of the bladder and the location of the polyps.

In this research, we propose a model that tackles the two main inefficiencies of the Guzev et al. (2019) and Lazebnik et al. (2020) models. This paper is organized as follows: in Section 2, we introduce our mathematical model of BCG treatment with the approximation of the geometrical configuration of the bladder. Afterwards, the numerical calculation used to solve the PDE and solution stability analysis. In Section 3, we present the model’s bifurcation points and their clinical impact. In Section 4, we offer a method to find the optimal time treatment protocol given the paitent’s start condition. In Section 5, we investigate the influence of the tumor depth and distribution in the urothelium on the optimal treatment protocol. In Section 6, we discuss the main clinical results arising from the model.

## 2. Mathematical modeling extension

Our aim in the development of this mathematical model is to allow clinical professionals to perform better and more personalized treatment in the scope of BCG immunotherapy of bladder cancer. The advantage of using a mathematical model is the ability to examine the biological system in relatively simple settings while producing clinical results which may be used on real patients. The mathematical model we present is a system of 10 s-ordered, nonlinear PDEs representing cell populations dynamic.

### 2.1. Model definition

The system of Eq. (1-14) represents the treatment of bladder cancer with BCG and IL-2 as the dynamics of cell populations (the values of the parameters that we used are shown in Table 3).

<div class="equation" id="eq-1"><img src="figures/eq-1.webp" width="348" height="70" alt="∂B(t, r) ∂t = ΣN−1 m=0bδ(t −mτ) −p1A(t, r)B(t, r) −p2B(t, r)Tu(t, r)− μBB(t, r) + D1 1 r2 ∂ ∂r ( r2∂B(r, t) ∂r ) (1)" loading="lazy" decoding="async"></div>

In Eq. (1), <sup>∂B(t,r)</sup> is the dynamical rate of BCG cell population distri∂*t* bution over time. It is affected by the following five terms. First, a quantity *b* of BCG instilled into the bladder every τ days. As the instillation of the BCG is modeled by a shifted Dirac delta function *δ*(*t* ˘*mτ*)*,m* ∈ {0*,* 1*,*…*,N*<sup>˘</sup>1}, the *m*<sub>th</sub> dose raises *B*(*t, r*) by *b* units at *t* = *mr*. Second, the elimination of BCG by antigen presenting cells (APCs) according to the rate coefficient − *p*<sub>1</sub>. Third, the BCG tumor cell groth at a rate coefficient − *p*<sub>2</sub>. Fourth, the bacteria cell death with rate coefficient *μ*<sub>β</sub>. Finally, the diffusion of the BCG cell population inside the bladder’s geometry is assumed to spread at rate coefficient *D*<sub>1</sub>.

<div class="equation" id="eq-2"><img src="figures/eq-2.webp" width="348" height="66" alt="∂A(t, r) ∂t = γ + ηA(t, r)B(t, r) −p1A(t, r)B(t, r) −μAA(t, r)− θp3EB(t, r)Ti(t, r)A(t, r) + D2 1 r2 ∂ ∂r ( r2∂A(r, t) ∂r ) (2)" loading="lazy" decoding="async"></div>

In Eq. (2) <sup>∂A(t,r)</sup> <sub>∂t</sub> is the dynamic of nonactivated APCs. It is affected by the following six terms. First, the normal influx of APCs to the tumor at a constant rate λ. Second, the recruitment of APCs due to bacterial infection at a rate coefficient τ. Third, the activation of APCs by BCG at the rate coefficient − *p*<sub>1</sub>. Fourth, the natural cell death at the rate coefficient, − *τ*<sub>A</sub>. Fifth, the two-stage elimination of tumor cells, first by effector CTL activity on BCG infected tumor cells, which leads to lysis of these cells and flooding of the tumor micro-environment with tumor antigens. The localized inflammatory response then attracts APCs, such as macrophages, which in turn eliminate uninfected tumor cells, according to the rate − *p*<sub>3</sub>. Finally, a diffusion of the APCs cell population inside the bladder’s geometry is assumed to spread at rate coefficient *D*<sub>2</sub>.

<div class="equation" id="eq-3"><img src="figures/eq-3.webp" width="350" height="64" alt="∂AT(t, r) ∂t = θp3EB(t, r)Ti(t, r)A(t, r) −λAT(t, r)Tu(t, r) I2(t, r) I2(t, r) + gI(t, r) −βAT(t, r) −μA1AT(t, r) + D3 1 r2 ∂ ∂r ( r2∂AT(r, t) ∂r ) (3)" loading="lazy" decoding="async"></div>

In Eq. (3) <sup>∂AT(t,r)</sup> is the tumor-Ag-activated APC (TAA-APC) dynamic. ∂*t* It is affected by the following five terms. First, the APCs which were activated by tumor antigen. Second, the tumor-Ag-activated APCs cells which destroy the uninfected tumor cells, with a rate coefficient λ. This term is multiplied by an IL-2-dependent parameter with a saturation constant *g*<sub>I</sub>, to propose that in the absence of IL-2, *A*<sub>T</sub> production ceases, while in the presence of external IL-2, the production term is close to 1. Third, the migration of TAA-APC to the draining lymphoid tissues at a rate of coefficient − *β*<sub>1</sub>. Fourth, the natural death of TAA-APC at a rate coefficient *μ*<sub>A1</sub>. Finally, the diffusion factor of the TAA-APC cells population in the bladder geometry is assumed to be *D*<sub>3</sub>.

<div class="equation" id="eq-4"><img src="figures/eq-4.webp" width="350" height="61" alt="∂AB(t, r) ∂t = p1A(t, r)B(t, r) −βAB(t, r) −μA1AB(t, r) +D4 1 r2 ∂ ∂r ( r2∂AB(r, t) ∂r ) (4)" loading="lazy" decoding="async"></div>

In Eq. (4) <sup>∂AB(t,r)</sup> is the dynamic of BCG-activated APCs. It is affected ∂*t* by the following four terms. First, the number of nonactivated APCs as well as BCG bacteria, with rate coefficient *p*<sub>1</sub>. Second, the migration of the infected, activated APCs to the draining lymphoid tissues, at rate coefficient *β*<sub>1</sub>. Third, the death of activated APCs at rate coefficient *A*<sub>1</sub>. Finally, the diffusion factor of the BCG-activated APCs cells population in the bladder geometry is assumed at coefficient *D*<sub>4</sub>.

<div class="equation" id="eq-5"><img src="figures/eq-5.webp" width="350" height="64" alt="∂EB(t, r) ∂t = βBAB(t, r)I2(t, r) AB(t, r) + g(t, r) −p3Ti(t, r)EB(t, r) −μEEB(t, r) +D5 1 r2 ∂ ∂r ( r2∂EB(r, t) ∂r ) (5)" loading="lazy" decoding="async"></div>

In Eq. (5) <sup>∂EB(t,r)</sup> is the dynamic of effector CTLs that react with BCG ∂*t* infection. It is affected by the following four terms. First, the migration term is proportional to *A*<sub>B</sub> and IL-2, with a maximal rate coefficient *β*<sub>B</sub>. This rate is brought to saturation by large numbers of *A*<sub>B</sub>, using a Michaelis–Menten saturation function, with Michaelis parameter *g*. Second, the decrease in CTLS population size from the inactivation of effector CTLs via their encounter with infected tumor cells (*T*<sub>i</sub>) at a success rate coefficient − *p*<sub>3</sub>. Third, the decrease in the BCG-effector CTL (*E*<sub>B</sub>) population size from the (*E*<sub>B</sub>) cells’ natural death rate *μ*<sub>E</sub>. Finally, the diffusion factor of the effector CTLs that react with BCG infection cell population in the bladder geometry is assumed at rate coefficient *D*<sub>5</sub>.

<div class="equation" id="eq-6"><img src="figures/eq-6.webp" width="350" height="64" alt="∂ET(t, r) ∂t = βTAT(t, r)I2(t, r) AT(t, r) + g(t, r) −p3Tu(t, r)ET(t, r) −μEET(t, r) +D6 1 r2 ∂ ∂r ( r2∂ET(r, t) ∂r ) (6)" loading="lazy" decoding="async"></div>

In Eq. (6) <sup>∂ET(t,r)</sup> is the dynamic of effector cells reacting with tumor ∂*t* Ag. It is affected by the following four terms. First, the migration element is proportional to *A*<sub>T</sub> and IL-2 with a maximal rate coefficient *β*<sub>T</sub>. This rate is brought to saturation by large numbers of *A*<sub>T</sub> using a Michaelis–Menten saturation function, with Michaelis parameter *g*. Second, the inactivation of effector CTLs via their encounter with uninfected tumor cells (*T*<sub>u</sub>), at a success rate coefficient − *p*<sub>3</sub>. Third, the *E*<sub>T</sub> natural death rate, with a rate coefficient *μ*<sub>E</sub>. Finally, the diffusion factor of the effector cells reacting with tumor Ag cell population in the bladder geometry is assumed at rate coefficient *D*<sub>6</sub>.

maximal growth rate coefficient (*r*), which is limited by the maximal tumor cell number (*K*). Second, bacterial infection, which is characterized by a coefficient rate of *p*<sub>2</sub>. Third, capturing and elimination of *T*<sub>u</sub> cells by APC cells (*A*), which were activated by tumor-Ag at a rate coefficient λ and to the activity of TAA-CTL effectors, (*E*<sub>T</sub>), which destroy uninfected tumor cells, (*T*<sub>u</sub>), at a rate coefficient α. The dependence in the equation of *T*<sub>u</sub> on *F*<sub>β</sub> is decreasing from 1 to *a*<sub>Tβ</sub> with Michaelis constant *e*<sub>T,β</sub>. And then there is a multiplication of those terms by an *I*<sub>2</sub>-dependent Michaelis–Menten term, with Michaelis parameter *g*<sub>I</sub>, to propose that in the absence of *I*<sub>2</sub>, *T*<sub>u</sub> cellular death does not occur. Since the tumor produces a variety of mechanisms in the biological settings that curtail the success of effector cell activity, they multiply <sub>I2+gI</sub> by *I*<sub>2</sub> <sub>Tu+gT</sub>, to denote the inversely proportional reduction in effector cell ac*g*<sub>T</sub> tivity rate, such that when *T*<sub>u</sub> = 0 the term is equal to 1 and when

<div class="equation" id="eq-7"><img src="figures/eq-7.webp" width="718" height="126" alt="∂I2(t, r) ∂t = ( AB ( t, r ) + AT ( t, r ) + EB ( t, r ) + ET ( t, r )( q1 −q2 I2(t, r) I2(t, r) + gI(t, r) ) + ΣN−1 m=0(i2δ(t −m)) −μI2I2(t, r) + D7 1 r2 ∂ ∂r ( r2∂dI2(r, t) ∂r ) (7)" loading="lazy" decoding="async"></div>

In Eq. (7) <sup>∂I2(t,r)</sup> is the IL-2 dynamic. It is affected by the following five ∂*t* processes, with all processes assuming equal expression at a constant rate coefficient *q*<sub>1</sub>. They reflect the IL-2 external source (*i*<sub>2</sub>), which is injected into the bladder every θ time units. First, *I*<sub>2</sub> is consumed by APCs and CTLs. They assume that the rate of consumption is similar for both types of cells and denote its coefficient by *q*<sub>2</sub>. The consumption depends on *I*<sub>2</sub> and is limited in a Michaelis–Menten fashion, with the Michaelis constant *g*<sub>I</sub>. Second, introduction of − *μ*<sub>I2</sub> , the *I*<sub>2</sub> degradation rate coefficient. Finally, the diffusion factor of the IL-2 cell population in the bladder geometry is assumed at rate coefficient *D*<sub>7</sub>.

<div class="equation" id="eq-8"><img src="figures/eq-8.webp" width="320" height="35" alt="∂Ti(t, r) ∂t = p2B(t, r)Tu(t, r) −p4EB(t, r)Ti(t, r) + D8 1 r2 ∂ ∂r r2∂dTi(r, t) ∂r" loading="lazy" decoding="async"></div>

<div class="equation" id="eq-9"><img src="figures/eq-9.webp" width="24" height="25" alt="(8)" loading="lazy" decoding="async"></div>

In Eq. (8) <sup>∂Ti(t,r)</sup> is the dynamic of infected tumor cells, and it depends ∂*t* on three mechanisms. The first mechanism corresponds only to the rate of bacterial infection of uninfected tumor cells, (*T*<sub>u</sub>), according to rate coefficient *p*<sub>2</sub>. The second is the elimination of infected tumor cells (*T*<sub>i</sub>) by their interaction with BCG-CTL effector cells (*E*<sub>B</sub>), at a rate coefficient − *p*<sub>4</sub>. Finally, the diffusion factor of the infected tumor cell population in the bladder geometry is assumed at rate coefficient *D*<sub>8</sub>.

( ) *lim*<sub>Tu→∞</sub> <sup>gT</sup> = 0. Finally, the diffusion factor of the uninfected *T*<sub>u</sub>+*g*<sub>T</sub> tumor cell population in the bladder geometry is assumed at rate coefficient *D*<sub>9</sub>. ∫ <sub>R</sub> *dF*<sub>β</sub>(*t*) (10) = *α*<sub>βT</sub> *T*<sub>u</sub>(*t, r*)*dr* − *μ*<sub>β</sub>*F*<sub>β</sub>(*t*) *dt r*<sub>0</sub>

In Eq. (10) <sup>dFβ(t)</sup> <sub>dt</sub> is the dynamic of a transforming growth factor-beta, proportional to the tumor cell population *T*<sub>u</sub> with *α*<sub>βT</sub> as a proportion coefficient and is destroyed at a rate of *μ*<sub>β</sub> proportional to *F*<sub>β</sub>. The dynamics of *F*<sub>β</sub> are not geometry dependent but the dynamics of *T*<sub>u</sub>(*t, r*) are geometry dependent. Therefore, the ∫<sup>R</sup> <sub>r0</sub> *T*<sub>u</sub>(*t, r*)*dr* provides all the uninfected tumor cells in the bladder’s geometry.

We assume the bladder’s geometry satisfies Eq. (11) as an approximation to the bladder’s geometrical configuration:

<div class="equation" id="eq-10"><img src="figures/eq-10.webp" width="350" height="26" alt="r2 0 ≤x2 + y2 + z2 ≤R2. (11)" loading="lazy" decoding="async"></div>

In Eq. (11), the variables *x*, *y*, *z* are the Cartesian coordinate system, *r*<sub>0</sub> and *R* are the radius of the internal and external spheres of the geometrical configuration, respectively. The bladder’s geometry is approximated using a perfect ring-sphere while the real human bladder is more like a ring-ellipsoid with three tunnels (Guzev et al., 2019). Fig. 1 visualizes the geometry of the system.

<div class="equation" id="eq-11"><img src="figures/eq-11.webp" width="718" height="141" alt="∂Tu(t, r) ∂t = rTu ( t, r )( 1 −Tu(t, r) K ) −p2B ( t, r ) Tu ( t, r ) − ( λAT ( t, r ) Tu ( t, r ) + αET ( t, r ) Tu ( t, r )αTβFβ + eT,β Fβ + eT,β ) I2(t, r) I2(t, r) + gI(t, r) gT(t, r) Tu(t, r) + gT(t, r) +D9 1 r2 ∂ ∂r ( r2∂dTu(r, t) ∂r ) (9)" loading="lazy" decoding="async"></div>

In Eq. (9) <sup>∂Tu(t,r)</sup> is the dynamic of uninfected tumor cells. It depends ∂*t* on four processes. First, the natural tumor growth characterized by a The boundary condition is based on two surfaces, the inner and outer sphere, respectively. The inner sphere boundary condition is assumed according to Eq. (12) known to be exactly *b* and decreases over time according to the system dynamics. The cells population associative to the immune system (e.g. *A, A*<sub>T</sub>*, A*<sub>β</sub>*, E*<sub>β</sub>*, E*<sub>T</sub>*, I*<sub>2</sub> ) is assumed to be equal to zero as the immune system does not allocate resources to the area until the BCG is injected. *T*<sub>i</sub> is assumed to be equal to zero as well because cancer cells were not able to be infected by BCG before any BCG is injected into the system. *T*<sub>u</sub> is assumed to be equally distributed inside each sphere approximating the cancer tumor. The inner sphere boundary condition is given to be:

<figure id="fig-1">
<img src="figures/fig-1.webp" width="235" height="224" alt="Representation of the model’s geometry from Eq" loading="lazy" decoding="async">
<figcaption><strong>Fig. 1.</strong> Representation of the model’s geometry from Eq. (11). The urothelium is divided into 8 layers of tissue, indexed from shallowest layer (smallest radius) indexed as 0 to deepest indexed as 7.</figcaption>
</figure>

<div class="equation" id="eq-12"><img src="figures/eq-12.webp" width="348" height="120" alt="∂B(r0, t) ∂r = b −θt, ∂A(r0, t) ∂r = 0, ∂AT(r0, t) ∂r = 0, ∂AB(r0, t) ∂r = 0, ∂EB(r0, t) ∂r = 0, ∂ET(r0, t) ∂r = 0, ∂I2(r0, t) ∂r = 0, ∂Ti(r0, t) ∂r = 0, ∂Tu(r0, t) ∂r = Tu(r, t0) / (R −r0) −Tu(r0, t). (12)" loading="lazy" decoding="async"></div>

The boundary condition of the external sphere is unknown. It is assumed that the natural cell population spread over time satisfies diffusion equations. Therefore, one can find the boundary condition of the external sphere by reverse engineering the values that best satisfy the known start conditions and internal boundary sphere conditions. Given the inner sphere boundary condition from Eq. (12) and the start condition from Eq. (14), algorithm (1) returns the outer sphere boundary condition.

Specifically, we used finite-elements in a 2d matrix where the geometry is represented by a tensor with 10<sup>6</sup> values and the step in time (Δ*t*) is 2 h (12 steps each day). Unless otherwise stated, it is assumed that the cancer polyps’ sizes are equal in the beginning of the treatment (*t*<sub>0</sub>). In addition, the cancer cells population is equally distributed in the urothelium’s geometry.

The <sup>dFβ(t0)</sup> equation is the outcome of solving the linear ordinary Eq. *dt* (13) for *F*<sub>β</sub>:

<div class="equation" id="eq-13"><img src="figures/eq-13.webp" width="350" height="35" alt="dFβ(t) dt = αβT Tu(t) −μβFβ. (13)" loading="lazy" decoding="async"></div>

The initial condition is assumed to be:

*B*(*r, t*<sub>0</sub>) = 0*, A*(*r, t*<sub>0</sub>) = *a, A*<sub>T</sub>(*r, t*<sub>0</sub>) = 0*, A*<sub>B</sub>(*r, t*<sub>0</sub>) = 0*,*

<div class="equation" id="eq-14"><img src="figures/eq-14.webp" width="248" height="20" alt="EB(r, t0) = 0, ET(r, t0) = 0, I2(r, t0) = 0, Ti(r, t0) = 0," loading="lazy" decoding="async"></div>

<div class="equation" id="eq-15"><img src="figures/eq-15.webp" width="34" height="18" alt="(14)" loading="lazy" decoding="async"></div>

<div class="equation" id="eq-16"><img src="figures/eq-16.webp" width="130" height="23" alt="Tu(r, t0) = Σn i=1Sp(αi, θi, ki)," loading="lazy" decoding="async"></div>

<div class="equation" id="eq-17"><img src="figures/eq-17.webp" width="259" height="34" alt="dFβ(t0) dt = e−αβT ⋅t −μβ(R −r0)Σn i=1(Sp(αi, θi, ki))eαβT ⋅tdt," loading="lazy" decoding="async"></div>

where *a >* 0 is the natural influx of APC cells, *n >* 0 the number of polyps at the beginning of the treatment, *Sp*(*α, θ, R*) is a sphere with radius *R* and origin in angles (*α, θ*) on the (*xy, xz*) plain, respectively.

### 2.2. Numerical solution

To obtain a better understanding of how different parameter values influence the system dynamics, in this section we illustrate the behavior of the system using numerical analysis. To carry out the numerical simulations of the tumor-immune model, we used the parameter values from Table 3.

Eq. (1-10) are PDEs, second order, nonlinear, from R<sup>2</sup> to R<sup>10</sup>, where R<sup>2</sup> is the space of both time (marked by *t*) and radial distance from the center of the bladder’s geometry configuration (marked by *r*) and R<sup>10</sup> is the population distribution of all nine populations (marked by *B*(*t,r*), *A*(*t, r*), *A*<sub>T</sub>(*t,r*), *A*<sub>B</sub>(*t,r*), *E*<sub>B</sub>(*t,r*), *E*<sub>T</sub>(*t,r*), *I*<sub>2</sub>(*t,r*), *T*<sub>i</sub>(*t,r*), *T*<sub>u</sub>(*t,r*)) and the value of growth factor-beta *F*<sub>β</sub>(*t*)). Galerkin-Petrov’s method is suitable for approximating the solution for such a system of equations (Skeel and Berzins, 1990).

In Eqs. (1)–(9) the leading (second order) factor is a diffusion dynamics and in Eq. (10) an ODE so the equations are elliptic. Therefore, Galerkin-Petrov’s method takes the form:

<figure class="table-figure" id="alg-1">
<figcaption><strong>Algorithm 1</strong>. Find external sphere boundary conditions</figcaption>
<img src="figures/alg-1.webp" width="514" height="175" alt="Algorithm 1. Find external sphere boundary conditions" loading="lazy" decoding="async">

</figure>

<figure id="fig-2">
<img src="figures/fig-2.webp" width="598" height="901" alt="Numerical simulation of trajectories of Eq" loading="lazy" decoding="async">
<figcaption><strong>Fig. 2.</strong> Numerical simulation of trajectories of Eq. (1 - 14) using Eq. (15 - 17)) with the parameter values from Table 3. The graphs show the evolution in time (days) of <em>B</em>(<em>t, r</em>)<em>, A</em>(<em>t, r</em>)<em>, A</em><sub>B</sub>(<em>t, r</em>)<em>, E</em><sub>B</sub>(<em>t, r</em>)<em>, E</em><sub>T</sub>(<em>t, r</em>), and <em>T</em><sub>i</sub>(<em>t, r</em>).</figcaption>
</figure>

<figure id="fig-3">
<img src="figures/fig-3.webp" width="530" height="1019" alt="Numerical simulation of trajectories of Eqs" loading="lazy" decoding="async">
<figcaption><strong>Fig. 3.</strong> Numerical simulation of trajectories of Eqs. (2, 7, and 9) using Eq. (15 - 17) with the parameter values from Table 3. The graphs show the evolution in time (days) of <em>I</em><sub>2</sub>(<em>t, r</em>)<em>, A</em>(<em>t, r</em>), and <em>T</em><sub>i</sub>(<em>t, r</em>) in different resolutions.</figcaption>
</figure>

<div class="equation" id="eq-18"><img src="figures/eq-18.webp" width="350" height="43" alt="C ( r, t, u, ∂u ∂r ) ∂u ∂t = r−2 ∂ ∂r ( r2f ( r, t, u, ∂u ∂r )) + s ( r, t, u, ∂u ∂r ) . (15)" loading="lazy" decoding="async"></div>

All the numerical calculations in this paper have been performed with *Matlab* software (version 2019b) using the *pdepe* function (Skeel and Berzins, 1990). However, the *pdepe* function has been modified to use specificity Eq. (15), provided with the system dynamics in Eq. (1-10), inner sphere boundary conditions from Eq. (12), and start conditions from Eq. (14).

The overall treatment has been divided into several components, following τ-long treatments as a result of the injection of BCG Σ<sup>N− 1</sup> <sub>m=0</sub>*bδ*(*t* − *mτ*) and IL-2 Σ<sup>N− 1</sup> <sub>m=0</sub>*i*<sub>2</sub>*δ*(*t* − *m*) in Eqs. (1) and (7), respectively. The start condition of each τ-long treatment, except the first one, has been updated according to Eq. (16). Similarly, the boundary condition has been updated according to Eq. (17).

*B*(*r, t*<sub>τ⋅i+Δt</sub>) = *B*(*r, t*<sub>τ⋅i</sub>) + *b, A*(*r, t*<sub>τ⋅i+Δt</sub>) = *A*(*r, t*<sub>τ⋅i</sub>)*,*

<div class="equation" id="eq-19"><img src="figures/eq-19.webp" width="230" height="20" alt="AT(r, tτ⋅i+Δt) = AT(r, tτ⋅i), AB(r, tτ⋅i+Δt) = AB(r, tτ⋅i)," loading="lazy" decoding="async"></div>

<div class="equation" id="eq-20"><img src="figures/eq-20.webp" width="230" height="21" alt="EB(r, tτ⋅i+Δt) = EB(r, tτ⋅i), ET(r, tτ⋅i+Δt) = ET(r, tτ⋅i)," loading="lazy" decoding="async"></div>

<div class="equation" id="eq-21"><img src="figures/eq-21.webp" width="34" height="26" alt="(16)" loading="lazy" decoding="async"></div>

<div class="equation" id="eq-22"><img src="figures/eq-22.webp" width="216" height="20" alt="I2(r, tτ⋅i+Δt) = I2(r, tτ⋅i), Ti(r, tτ⋅i+Δt) = Ti(r, tτ⋅i)," loading="lazy" decoding="async"></div>

<div class="equation" id="eq-23"><img src="figures/eq-23.webp" width="113" height="20" alt="Tu(r, tτ⋅i+Δt) = Tu(r, tτ⋅i)," loading="lazy" decoding="async"></div>

<div class="equation" id="eq-24"><img src="figures/eq-24.webp" width="351" height="246" alt="dFβ(tτ⋅i+Δt) dt = e−αβT t −μβ ∫R r0 Tu(r, tτ⋅i)dr eαβT tdt, ∂B(r0, τ⋅i + Δt) ∂r = b + B(r0, τ⋅i), ∂A(r0, τ⋅i + Δt) ∂r = A(r0, τ⋅i), ∂AT(r0, τ⋅i + Δt) ∂r = AT(r0, τ⋅i), ∂AB(r0, τ⋅i + Δt) ∂r = AB(r0, τ⋅i), ∂EB(r0, τ⋅i + Δt) ∂r = EB(r0, τ⋅i), ∂ET(r0, τ⋅i + Δt) ∂r = ET(r0, τ⋅i), ∂I2(r0, τ⋅i + Δt) ∂r = i" loading="lazy" decoding="async"></div>

where *i* ∈ N is the *i*<sub>th</sub> day of the overall treatment. The values of the model’s parameters are shown in Table 3 (see Appendix). The solutions of the system (1–14) with the parameter assumptions and values we used are shown in Fig. 2. Fig. 2 shows the cell population sizes over time of *B*(*t,r*), *A*(*t,r*), *A*<sub>B</sub>(*t,r*), *E*<sub>B</sub>(*t,r*), *E*<sub>T</sub>(*t,r*), and *T*<sub>i</sub>(*t, r*) where the x-axis in all nine graphs represents the time (in days) that has passed from the beginning of the treatment and the y-axis is the size of each cell population size, respectively. Fig. 3 shows the cell population of *I*<sub>2</sub>(*t,r*), *A*<sub>T</sub>(*t, r*), and *T*<sub>u</sub>(*t,r*), where part of each graph is presented in a different scale.

The BCG (*B*) population reaches an upper limit, as shown in Fig. 2a. The maximum values of BCG (on days {7*i*}<sup>9</sup> <sub>i=1</sub>) occur on the days of the BCG injection, and during the week they decrease to a level of 2⋅ 10<sup>10</sup>. Fig. 3a shows the harmonic behavior of IL-2 (*I*<sub>2</sub>), where *i*<sub>2</sub> is introduced every {7*i*}<sup>9</sup> <sub>i=1</sub> day, which decreases to around 750 in the same day (as shown in Fig. 3a). In Fig. 3b nonactivated APC (*A*) cells significantly decrease until the third week, where there is converge to a harmonic oscillation between 5 and 10 (as shown in Fig. 3b).

<figure id="fig-4">
<img src="figures/fig-4.webp" width="303" height="233" alt="Discrete sampling of the system’s image space" loading="lazy" decoding="async">
<figcaption><strong>Fig. 4.</strong> Discrete sampling of the system’s image space. Blue pixels represent a successful treatment, red pixels represent an unsuccessful treatment, and green dots represent border pixels.</figcaption>
</figure>

In Fig. 2b it was shown that the population of APC activated by BCG (*A*<sub>b</sub>) cells converges to the upper limit value of 1*.*4⋅10<sup>6</sup>. The same phenomenon occurs in CTL effector cells infected by BCG, as shown in Fig. 2d. Effector cells reacted to the Ag tumor grow in the first four weeks and then decrease. In addition, on the BCG injection days the cell population sharply increases, as shown in Fig. 2e. In Fig. 2c TAA-APC (*A*<sub>T</sub>) cells growth during first four weeks. After the fourth week, *A*<sub>T</sub> decreases over time, except for a local increase on the days when BCG is administered.

In Fig. 2f, the population of cancer cells infected by BCG increases during the first week. After the second injection of BCG into the bladder, the *T*<sub>i</sub> population decreases over time with the local maximums on the BCG injection days, as shown in Fig. 2f. Additionally, in Fig. 3fc uninfected cancer cell populations (*T*<sub>u</sub>) decrease over time, and in the first week this sharp decrease occurs with a constant rate (̃ 0*.*7). Each week, the population decreases in one factor of magnitude (̃ 10<sup>− 1</sup>) as shown in Fig. 3c.

### 2.3. Solution stability

Lyapunov’s stability analysis method cannot be used for the system (1–14) because it does not satisfy the needed conditions (Buis, 1968). The system does not diverge to infinity on a representative case as presented in Fig. 2. Therefore, it is possible to analyze its stability for a given set of parameters using the system’s image space (Guzev et al., 2019).

Basically, the main goal is to find a treatment protocol resulting in a tumor-free equilibrium given a patient condition in the beginning of the treatment. We define a *successful treatment* as a treatment resulting in tumor-free equilibrium (*T*<sub>u</sub>(*t*<sup>\*</sup>*, r*) = 0) and *unsuccessful treatment* otherwise, where *t*<sup>\*</sup> is the time at the end of the treatment.

In our model, four parameters affect the success of treatment: First, the initial cancer cell population size *T*<sub>u</sub>(*t*<sub>0</sub>). Second, the amount of BCG *b* injected over the course of the treatment. Third, the overall time of the treatment *t* in days; Fourth, the amount of IL-2 *i*<sub>2</sub> injected over the course of the treatment. Based on these, it is possible to define a four dimensional space to investigate the influence of *T*<sub>u</sub>(0)*, b, t,* and *i*<sub>2</sub> on the success of the treatment protocol. Determining which initial condition of the patient and which treatment protocol leads to successful treatment can be performed using the solution stability method described in (Lazebnik et al., 2020).

For our analysis we neglect IL-2 from the parameters and, therefore, are left with a three dimensional space defined by *T*<sub>u</sub>(0)*, b,* and *t*. We define a function *S* : R<sup>3</sup>→Z<sub>2</sub> such that *S*(*T*<sub>u</sub>(*t*<sub>0</sub>)*, b, t*) ∈{0*,* 1} where 1 represents successful treatment and 0 represents unsuccessful treatment. For any vector *v* ∈(*T*<sub>u</sub>(*t*<sub>0</sub>)*,b,t*), it is satisfied that *S*(*v*) is the solution for system (1–14) with the parameters from Table 3. The binary classification is determined according to a set of factors *C* = {*c*<sub>i</sub>}<sup>9</sup> <sub>i=0</sub>. Where ∀*i* ∈ {0*,* …*,* 9} : *c*<sub>i</sub> ∈ R<sup>+</sup> are thresholds of the nine population sizes *B*(*t*), *A*(*t, r*), *A*<sub>T</sub>(*t*), *A*<sub>B</sub>(*t*), *E*<sub>B</sub>(*t*), *E*<sub>T</sub>(*t*), *I*<sub>2</sub>(*t*), *T*<sub>i</sub>(*t*), and *T*<sub>u</sub>(*t*), respectively. It is assumed that there are lower and upper boundaries for each one of the parameters (*T*<sub>u</sub>(*t*<sub>0</sub>)*,b,t*). All three parameters are lower-bounded by 0 as they cannot be negative. The upper boundary for *T*<sub>u</sub>(*t*<sub>0</sub>) is the number of all cells in the bladder. The amount of *b* injected is bounded by the bladder’s volume and the treatment time is bounded because medical treatment cannot be provided for eternity.

<figure id="fig-5">
<img src="figures/fig-5.webp" width="825" height="996" alt="Bifurcation in Tu, Ab, Ti, and At cell population" loading="lazy" decoding="async">
<figcaption><strong>Fig. 5.</strong> Bifurcation in <em>T</em><sub>u</sub><em>, A</em><sub>b</sub><em>, T</em><sub>i</sub><em>,</em> and <em>A</em><sub>t</sub> cell population. Each color (and line style) represents a different value on the changes parameter.</figcaption>
</figure>

This results in space P⊂R<sup>3</sup>. P is a compact parameter’s set because it is complete (as a sub-set of R<sup>3</sup>) and bounded. We assume that the image of function *S*|<sub>P</sub> is continuous and can be restored from discrete sampling.

Fig. 4 presents the space *S*|<sub>P</sub> which has been sampled 16000 times, *T*<sub>u</sub>(0) sampled 40 times ranging from 0 to 2*.*5⋅10<sup>8</sup> in equal steps, *b* marked as *BCG* sampled 40 times ranging from 0 to 2*.*14⋅ 10<sup>6</sup> in equal steps, and the treatment time in weeks *t* sampled 10 times ranging from 0 to 10 in equal steps. A treatment is considered successful if it satisfies *T*<sub>u</sub> = 0 ∧*BCG <* 10<sup>8</sup>. The sampled space size is the largest that a modern personal computer was able to calculate in 8 h.

All the pixels in Fig. 4 have been computed successfully (no diversions at any *T*<sub>u</sub>(0)*, b, t*). Using these values, it is easy to see that by picking *k* = 1 then function *S* satisfies the Lipschitz continuity condition

*d*<sub>1</sub>(*S*(*v*<sub>1</sub>)*, S*(*v*<sub>2</sub>)) ≤*k*⋅*d*<sub>3</sub>(*v*<sub>1</sub>*, v*<sub>2</sub>)*,* where *d*<sub>i</sub> is the Euclidean distance function in R<sup>i</sup>. Recall, we assume that *S* continues and can be restored from a discrete sample. Therefore, for some value *ε >* 0, there exists a unique solution to the initial value problem *S*(*v*) according to the Picard–Lindel¨of theorem (Coddington and Levinson, 1955). Therefore, the system (1–14) is numerically stable on the sampled sub-space P.

## 3. Bifurcation analysis

Bifurcations in the cell population of *A*<sub>B</sub>*, A*<sub>T</sub>*, T*<sub>i</sub>*, T*<sub>u</sub> arise from changes in *T*<sub>u</sub>(0)*, r,* and *b*. Such bifurcations indicate various clinical results for different treatment protocols and allow to drawing the line between successful and unsuccessful treatment protocols.

The bifurcation numerically emerges in the cases where the sensitivity analysis (Section 7.2) shows *behaviorally-different* dynamics for different values of the parameter in question. We define two functions *P*<sub>1</sub> and *P*<sub>2</sub> *behaviorally-different* if there is no *t*<sub>i</sub> ∈{0*,* …*, t*<sub>max</sub>} such that

<div class="equation" id="eq-25"><img src="figures/eq-25.webp" width="352" height="37" alt="∫tmax ti d2P1(t −ti) dt2 −d2P2(t) dt2 dt &lt; x, (18)" loading="lazy" decoding="async"></div>

where *P*<sub>1</sub>*, P*<sub>2</sub> are a polynomial interpolation of a cell population that originated from two different values and *x* is a manually picked threshold. Fig. 5 is the result of picking *x* = 1.

The motivation for Eq. (18) is to find an interval [*t*<sub>i</sub>*, t*<sub>max</sub>] such that the difference between curvatures of two functions is small enough (*x*) in time. If two functions satisfy this condition, then, there is some point in time *t*<sub>i</sub> in the treatment protocol where the sum of differences in the changes of the cell populations are significant enough and the original functions should present an entirely different behavior.

Fig. 5a and b presents the bifurcation in the dynamics of *T*<sub>u</sub> and *A*<sub>b</sub>, respectively. In the case where *T*<sub>u</sub>(0) = 2⋅10<sup>6</sup> then the population of *T*<sub>u</sub> is decreasing over time and *A*<sub>b</sub> converge to 1*.*5⋅10<sup>6</sup> after three weeks. On the other hand, where *T*<sub>u</sub>(0) = 2*.*7⋅10<sup>8</sup> the population of *T*<sub>u</sub> increases over time and *A*<sub>b</sub> has harmonic behavior oscillating between 7*.*5⋅10<sup>5</sup> and 1*.*75⋅ 10<sup>6</sup>.

This bifurcation is associated with the fact that a small enough amount of cancer cells in the beginning of the treatment leads to relatively small amplitude in the BCG-activated APC *A*<sub>B</sub> cell population size, after converging to 1*.*3⋅10<sup>6</sup>. The small amplitude reflects the overall immune system’s response; the *A*<sub>B</sub> population is slightly affected by different amounts of injected BCG *b* as shown in Fig. 10. Similarly, a large amount (2*.*7 ⋅10<sup>8</sup>) of cancer cells in the beginning of the treatment leads to more sporadic behavior of the immune system.

Fig. 5c presents the bifurcation in the dynamics of *T*<sub>i</sub> from the changes in the natural tumor growth *r*. In the case where *r* = 2*.*73⋅10<sup>− 1</sup> the population of *T*<sub>i</sub> increases in the first seven weeks and then decreases. On the other hand, where *r* = 2*.*92⋅10<sup>− 1</sup> the population of *T*<sub>i</sub> monotonically increases over time.

Fig. 5d and e presents the bifurcation in the dynamics of *T*<sub>u</sub> and *A*<sub>t</sub> from changes in the BCG installations *b*, respectively. In the case where *b* = 10<sup>5</sup> the population of both *A*<sub>t</sub> and *T*<sub>u</sub> monotonically increases over time. On the other hand, where *b* = 2*.*5⋅10<sup>5</sup> the populations of both *T*<sub>u</sub> and *A*<sub>t</sub> decrease to zero.

## 4. Time optimal treatment protocol

The question is whether it is possible to find the optimal treatment protocol in accordance with the initial conditions of the patient. By finding the equation describing the border between successful and unsuccessful treatment protocols in continuous settings, it can be determined if it is feasible to predict if a treatment will result in tumor-free equilibrium or not. In space P this is a phase transformation between unsuccessful and successful treatment in time as shown in Fig. 4.

Considering the initial state of the patient as the size of the cancer cell population at the beginning of treatment (*T*<sub>u</sub>(*t*<sub>0</sub>)), the treatment protocol as the amount of BCG injected (*b*) and the frequency of its introduction into the bladder (*m*), the optimal treatment ensures a minimum duration (if it exists) so that the treatment is successful. This phase transformation can be defined by a border function *BF* : R<sup>2</sup>→R such that *BF*(*T*<sub>u</sub>(0)*,b*)→*t*. Given (*T*<sub>u</sub>(0)*,b, m* = 7), any time *t* that satisfies *t >*= *t*<sub>min</sub> will result in a successful treatment and *t < t*<sub>min</sub> otherwise, where *t*<sub>min</sub> = *BF*(*T*<sub>u</sub>(0)*, b*).

It is possible to approximate the border function using the border pixels and then using the least mean square (LMS) method (Bj¨orck, 1996) to approximate the border function itself. First, a pixel (*i,j,k*) will be defined as a *border pixel* iff it satisfies

<div class="equation" id="eq-26"><img src="figures/eq-26.webp" width="176" height="25" alt="Σi+1 a=i−1Σj+1 b=j−1Σk+1 c=k−1S(a, b, c) ∕∈{0, 27}," loading="lazy" decoding="async"></div>

where {0*,* 27} are the cases where all the values of 3 × 3 × 3 window centered in the pixel (*i,j,k*) are the same (either 0 or 1). Fig. 4 shows the border pixels in green. This method is inspired by computer vision threshold based edge detection algorithms (Yellasiri et al., 2011).

Second, to use the LMS method one needs to define the family function approximating the function. The function family has been chosen to balance between the accuracy of the sampled data on the one hand and simplicity of usage on the other (Shanock et al., 2010). The border function is obtained with a coefficient of determination *R*<sup>2</sup> = 0*.*85, using the LMS method. Therefore, it is safe to claim that function *f*(*b, T*<sub>u</sub>(0)) is well fitting the data and presents a good approximation for the border function, which is easy and stable to compute.

*f* (*b, T*<sub>u</sub>(0)) = *a*<sub>1</sub> + *a*<sub>2</sub>*b* + *a*<sub>3</sub>*T*<sub>u</sub>(0) + *a*<sub>4</sub>*bT*<sub>u</sub>(0) + *a*<sub>5</sub>*b*<sup>2</sup> + *a*<sub>6</sub>*T*<sub>u</sub>(0)<sup>2</sup>

<div class="equation" id="eq-27"><img src="figures/eq-27.webp" width="350" height="38" alt="f (b, Tu(0)) = 9.034 −3.0 ⋅10−9b + 1.7 ⋅10−7Tu(0) + 1.72 ⋅10−16bTu(0) +4.984 ⋅10−17b2 −4.369 ⋅10−15Tu(0)2 (19)" loading="lazy" decoding="async"></div>

For example, consider a patient who has a polyp in the urinary bladder of size *T*<sub>u</sub>(*t*<sub>0</sub>) = 5⋅10<sup>6</sup> cells, and receives BCG treatment *b* = 2⋅ 10<sup>6</sup> once a week. By setting these values in the Eq. (19), the minimal treatment time, 10 weeks, will be possible for successful results.

## 5. Treatment protocol based on initial tumor distribution

Weiner et al. (2019) have shown that the localization of a cancer polyp in the bladder affects the dynamics of cells inside the bladder as a result of differences in the biological reaction to treatment. The model proposed by Grabnar et al. (2006) is a mathematical model that describes the interaction of different layers of the urinary bladder from a biological point of view. They presented the variable drug concentration due to urine formation and voiding diffusion in the bladder tissue with parameters from *in vitro* experiments.

<figure id="fig-6">
<img src="figures/fig-6.webp" width="825" height="723" alt="The dynamics of the system where the cancer cells Tu are equally distributed at a single layer of the urothelium at the beginning of the treatment (t0)" loading="lazy" decoding="async">
<figcaption><strong>Fig. 6.</strong> The dynamics of the system where the cancer cells <em>T</em><sub>u</sub> are equally distributed at a single layer of the urothelium at the beginning of the treatment (<em>t</em><sub>0</sub>). Each color represents the cell population size in the whole geometry. The x-axis is the time (in days) from the beginning of the treatment. The y-axis is the cell population size.</figcaption>
</figure>

The model proposed in Eq. (1 - 14) takes into consideration the bladder’s geometry (Eq. (11)) and the diffusion dynamics of cell population biological reactions. Specifically, adding the diffusion dynamics to Eqs. (1)–(9) and the border condition from Eq. (12) and Algorithm 1. The model allows to fine-tune the prediction according to the tumor’s depth in the urothelium at the beginning of the treatment which in turn improves the accuracy of the model and therefore more accurately predicts the treatment result.

Cancer polyps depth and distribution inside the bladder’s geometry can be approximated using multiple ring-sphere shaped layers of the urothelium, centralized in the center of bladder. According to this approximation, it is possible to define a two-parameter space which describes non-isomorphic instances of tumor depths in the bladder’s geometry at time *t*<sub>0</sub> of the treatment. The normalized size of cancer cell ( ) population <sup>Tu(r,t)</sup> and the distribution of the population in the eighth ||*T*<sub>u</sub>(*r,t*)|| layer of the urothelium.

Figs. 6 and 7 are derived using Eq. (15) as well, at the beginning of the treatment *t*<sub>0</sub>, the geometry of the bladder as presented in Fig. 1, has been divided into eight separated geometries (layers). Each bladder tissue layer’s geometry satisfies the condition:

<div class="equation" id="eq-28"><img src="figures/eq-28.webp" width="279" height="37" alt="r0 + i⋅(R −r0) 8 )2 ≤x2 + y2 + z2 ≤ r0 + (i + 1)⋅(R −r0) 8 )2 ," loading="lazy" decoding="async"></div>

where *i* ∈[0*,* …*,* 7] is the index of the layer. Each geometry has been represented by a two-dimensional array (grid), where cancer cells have been allocated to a layer, with the values of the array assigned to be the amount of the uninfected cancer cells.

It is possible to analyze the differences in the dynamics between the layers of the urothelium, allowing us to better understand the differences in the dynamic in each tissue layer. Fig. 6 shows the dynamics of the system where the cancer cells *T*<sub>u</sub> are equally distributed at a single layer of the urothelium. The population of BCG infected cancer cells *T*<sub>i</sub> grows faster in the first 2 weeks as the cancer found only in a deeper layer but is reduced at a faster rate after the second week, as shown in Fig. 6a. Similarly, when the cancer cells are found deeper in the urothelium at the beginning of the treatment than the population of cancer cells *T*<sub>u</sub> decays at a slower rate, as shown in Fig. 6b. In addition, the reaction of the immune system is relatively small, as shown in Fig. 6c and d.

<figure id="fig-7">
<img src="figures/fig-7.webp" width="825" height="733" alt="The dynamics of each individual layer of the system’s geometry where the cancer cells Tu are equally distributed at the first (most shallow) layer of the urothelium at the beginning of the treatment (" loading="lazy" decoding="async">
<figcaption><strong>Fig. 7.</strong> The dynamics of each individual layer of the system’s geometry where the cancer cells <em>T</em><sub>u</sub> are equally distributed at the first (most shallow) layer of the urothelium at the beginning of the treatment (<em>t</em><sub>0</sub>). Each color represents the cell population size in a different layer of the urothelium. The x-axis is the time (in days) from the beginning of the treatment. The y-axis is the cell population size.</figcaption>
</figure>

<figure class="table-figure" id="table-1">
<figcaption><strong>Table 1</strong> The sensitivity of the model to the initial distribution of cancer cells in different layers of the bladder at the beginning of treatment (<em>t</em><sub>0</sub>). <em>SP</em> is defined as the difference between the uninfected cancer cell population from the treatment protocols with the biggest population size of uninfected cancer cells and smallest population size at time <em>t</em><sub>max</sub>. <em>AP</em> is defined as the average uninfected cancer population size for all the possible combinations of different treatment protocols that differ in the distribution of the uninfected cancer cells in the layers of the urothelium. The values were calculated over the first four weeks of the treatment.</figcaption>
<div class="table-scroll"><table><tr><th></th><th>1 layer</th><th>2 layers</th><th>3 layers</th><th>4 layers</th><th>5 layers</th><th>6 layers</th></tr><tr><td>SP [m3t]</td><td>1.90 ⋅ 107</td><td>1.63 ⋅107</td><td>1.36 ⋅107</td><td>0.88 ⋅107</td><td>0.70 ⋅ 107</td><td>0.54 ⋅107</td></tr><tr><td>AP [m3t]</td><td>1.157 ⋅ 109</td><td>1.155 ⋅109</td><td>1.159 ⋅ 109</td><td>1.158 ⋅109</td><td>1.159 ⋅109</td><td>1.157 ⋅ 109</td></tr></table></div>

</figure>

All cell population sizes for the different cases converge after 10 weeks, which can be associated with the fact that after enough time the diffusion of the cells’ populations are spread all over the geometry of the bladder and from that point operating as instance response, making the location insignificant, as shown in Fig. 6.

It is possible to divide the geometry to the eight layers of the urothelium to examine the influence of the initial cancer polyp depth on the layer level. Fig. 7 shows the dynamics of each individual layer of the system’s geometry where the cancer cells are equally distributed in the first (most shallow) layer of the urothelium.

The cancer starts to spread to other layers where layers closer to the polyps are affected faster. Nevertheless, in the first week of the treatment, the overall population of uninfected cancer cells (*T*<sub>u</sub>) decreases, as shown in Fig. 7b. As a result, the BCG-infected cell population (*T*<sub>i</sub>) shows a different increment rate in different layers until the end of the second week, where the changes between the different layers become negligible. Moreover, the first and eighth layers show a slightly different behavior in comparision to the other six layers. This phenomenon can be explained by the fact that these are the border layers of the model and have only one neighbor layer to spread to other layers which have two neighbor layers to spread to, as shown in Fig. 7a where the first and eighth layers show faster increase in the first three weeks of the treatment, reaching a higher maximum (1*.*2⋅10<sup>6</sup>) compared to the other six layers (1⋅ 10<sup>6</sup>). The populations of TAA-APC *A*<sub>t</sub> and CTL reacting to tumor Ag. *E*<sub>t</sub> cells show similar behavior, as shown in Fig. 7c and d, respectively. In both Figs. 6 and 7, the cell populations *B, I*<sub>2</sub>*, A, A*<sub>b</sub>, and *E*<sub>B</sub> are not shown as the changes are neglected relative to the dynamics shown in Fig. 2.

From clinical trials, it is known that cancer cells usually spread across multiple layers of the urothelium (Weiner et al., 2019). To examine the influence of the number of tumor polyps on the system, multiple layers with tumors can be initialized. Table 1 shows the differences in the dynamics of the uninfected cancer cell *T*<sub>u</sub> population size given a combination of {*k*}<sup>6</sup> <sub>0</sub> different layers where the cancer cells are equally distributed. *SP* is defined as the difference between the treatment protocol with the biggest population size and smallest population size [*m*<sup>3</sup>*t*]. This metric allows for measurement of the difference between the different treatment protocols of cancer cell population that originated in multiple layers of the urothelium, calculated as follows

<div class="equation" id="eq-29"><img src="figures/eq-29.webp" width="157" height="43" alt="∫tmax t=0 ∫R r=ro Tα u (t, r) −Tβ u(t, r)⃒⃒drdt," loading="lazy" decoding="async"></div>

where *T*<sup>α</sup> <sub>u</sub>(*t, r*) and *T*<sup>β</sup> <sub>u</sub>(*t, r*) are two different cancer cell populations dynamics from different initial conditions.

*AP* is defined as the average cancer population size for all the possible combinations. The values are calculated over the first four weeks of the treatment as follows

<div class="equation" id="eq-30"><img src="figures/eq-30.webp" width="94" height="36" alt="∫tmax t=0 Σp∈PTu(t, r) |P| dt," loading="lazy" decoding="async"></div>

where *P* is the set of all the possible isomorphic permutations of *k* layers from the eight layers of the urothelium.

The differences between the case with the biggest population size of uninfected cancer cells at time *t*<sub>max</sub> and with the smallest population size are reduced as the cancer is initialized in more layers. In addition, the average case for different amounts of initial layers that cancer cells are similarly distributed for all {*k*}<sup>6</sup> <sub>0</sub> layers, is shown in Table 1.

Based on Table 1 and Fig. 7b, it can be noticed that the treatment starts to be efficient after the BCG arrives at the deepest layer where the cancer polyp is located. In Fig. 7b, the amount of uninfected cancer cells *T*<sub>u</sub> is almost equal after the first week across all the layers.

We argue that a treatment protocol should aim to arrive at the point where the BCG arrives at the deepest layer where the cancer polyp is located in the dynamics as early as possible. From Eq. (1) the diffusion of the BCG influences the distribution of the BCG in the geometry. The BCG diffusion is

<div class="equation" id="eq-31"><img src="figures/eq-31.webp" width="101" height="35" alt="D1 1 r2 ∂ ∂r r2∂B(r, t) ∂r ." loading="lazy" decoding="async"></div>

Both *r* and *D*<sub>1</sub> are properties of the bladder and a way to influence them does not exist in the scope of this treatment. On the other hand, the size of the population *B*(*r, t*) can be changed in the treatment protocol by introducing into the system an increased amount of BCG. A larger amount of BCG results in faster spread of the BCG in the geometry of the bladder. Fig. 6b shows that the size of *T*<sub>u</sub> in the whole geometry for the same amount of injected BCG *b*.

<figure class="table-figure" id="table-2">
<figcaption><strong>Table 2</strong> The amount of BCG needed to be injected in the first week is a function of the deepest layer of where the uninfected cancer cell population is located at the beginning of the treatment to get <em>T</em><sub>u</sub> − <em>similar</em> treatment protocols with the baseline. <em>t</em><sub>max</sub> is taken to be the 42 days that it takes to match the standard treatment duration (Paterson and Patel, 1998).</figcaption>
<div class="table-scroll"><table><tr><th>Layer</th><th>1st (baseline)</th><th>2nd</th><th>3rd</th><th>4th</th><th>5th</th><th>6th</th><th>7th</th><th>8th</th></tr><tr><td>BCG (b⋅ 106)</td><td>1.07</td><td>1.16</td><td>1.48</td><td>1.91</td><td>2.49</td><td>3.12</td><td>3.88</td><td>5.04</td></tr></table></div>

</figure>

The motivation is to reduce the initial spread of the cancer cell population (*T*<sub>u</sub>(0)) inside the geometry of the bladder relatively quickly. In doing so, the point can be reached where the system’s dynamic operates as an instant response and the geometry can be neglected (Lazebnik et al., 2020). Such an approach may be used to personalize the treatment protocol according to the patent’s initial spread of the cancer cell population at the beginning of the treatment, aiming to arrive at the point in the treatment where the treatment protocol can be replaced with a generic one with the best results.

Recall, we define a treatment protocol by the four parameter *T*<sub>u</sub>(0)*, b, t,* and *i*<sub>2</sub>. We define two treatment protocols *TP*<sub>1</sub>*, TP*<sub>2</sub> which differ only in the injected amount of BCG *b* to be *T*<sub>u</sub> − *similar* after some time *t*<sup>\*</sup> if and only if the *T*<sub>u</sub>(*t*<sup>\*</sup>) resulting from treatment protocol *TP*<sub>1</sub> (marked as *T*<sub>u</sub>(*t*<sup>\*</sup>)|<sub>TP1</sub>) and *TP*<sub>2</sub> (marked as *T*<sub>u</sub>(*t*<sup>\*</sup>)|<sub>TP2</sub>) satisfies

<div class="equation" id="eq-32"><img src="figures/eq-32.webp" width="70" height="42" alt="Tu(t*)|TP1 Tu(t*)|TP2 &lt; k," loading="lazy" decoding="async"></div>

where *k >* 1 ∈ R. The motivation of the definition is to declare that the population of uninfected cancer cells *T*<sub>u</sub>(*t, r*) in the whole geometry for two protocols is in one level of magnitude defined by some factor *k*.

Table 2 shows the amount of BCG that is needed in the first week such that a treatment protocol (*TP*) will be *T*<sub>u</sub> − *similar* at time *t*<sup>\*</sup> = *t*<sub>7</sub> to the treatment protocol that satisfies *T*<sub>u</sub>(0) = 1⋅10<sup>6</sup>, *k* = 10 and *b* = 1*.*07⋅10<sup>6</sup>, where *t*<sub>7</sub> is the seventh day of the treatment.

## 6. Conclusions

Mathematical modeling has already been shown to be a useful tool for studying the mechanism of tumor growth and response to therapy (Bunimovich-Mendrazitsky et al., 2015a; Bunimovich-Mendrazitsky and Goltser, 2011; Matzavinos et al., 2004; Bunimovich-Mendrazitsky et al., 2019). Models which better represent the biological and clinical dynamics and complexity can provide a better understanding of the system, resulting in more accurate prediction of an outcome of a treatment and determination of better therapeutic protocols (Shaikhet and Bunimovich-Mendrazitsky, 2018; Guzev et al., 2019). Specifically, models based on population analysis are a common way of describing such systems (Bunimovich-Mendrazitsky et al, 2015a; Kirschner and Panetta, 1998).

Based on the proposed model, the bifurcation for *T*<sub>u</sub>*, A*<sub>b</sub>*, T*<sub>i</sub>*, T*<sub>u</sub>*,* and *A*<sub>t</sub> resulted in changes in *T*<sub>u</sub>(0), *r*, and *b* as shown in Fig. 5. We argue that these bifurcations are the border line between a successful and unsuccessful treatment and the found values can be used to assist in clinical decisions based on the proposed treatment protocol.

In addition, a time optimal treatment protocol has been proposed using the stable matrix defined by the parameters that affect the success of a treatment based on the system’s image space (Guzev et al., 2019). A formula that, given the patient’s cancer cell population size at the beginning of the treatment *T*<sub>u</sub>(0) and the amount of BCG installations *b*, returns the minimal treatment time in days for the treatment to be successful as shown in Eq. (19).

Furthermore, we show that the proposed model takes into consideration the initial distribution of the cancer cells over the geometry of the bladder and as such can provide more customized treatment by providing tumor polyps depth in the urothelium. Fig. 6 shows that a cancer tumor that originates in a shallower layer of the urothelium can be treated with less aggressive treatment either in treatment duration or injection of BCG *b*. Layer specific treatment is insignificant and in the case where the tumor polyps are spread out, it is easier to instead treat the case where the tumor is localized in a deep layer of the urothelium, as shown in Fig. 7 and Table 1.

Moreover, Table 2 shows the amount of BCG that is needed to be introduced in the first week of the treatment such that the model can neglect the geometry of the bladder without meaningful loss of accuracy. Providing a personal BCG injection protocol at the beginning of

## Appendix

### 7.1 Computationally Parameter’s Values

treatment gives the best results.

These results are important for BCG immunotherapy, which modulates the healing effect. Understanding the key processes in tumor-immune interactions will be crucial for the development of effective treatments, for setting goals, as well as for optimizing dosage and schedule. The model presented here takes a step towards demonstrating the effect of the depth of the cancer and its spread, and further extensions of the model will be used to learn how to manage the treatment protocol for the successful elimination of bladder cancer.

## Declarations of competing interest

None.

Table 3 describes the parameter values used in the calculation of the model not mentioned otherwise. All the values were taken from (Guzev et al., 2019). Parameters {*D*<sub>i</sub>}<sup>9</sup> <sub>i=1</sub> taken from (Lazebnik et al., 2020). *D*<sub>1</sub> satisfies the same conditions as Eq. (1) from (Lazebnik et al., 2020). *D*<sub>2</sub>*,D*<sub>3</sub>*,D*<sub>4</sub>*,D*<sub>5</sub>*,D*<sub>6</sub>, and *D*<sub>7</sub> are equal to the diffusion factor of the effector cells *E* assuming the diffusion of the cell population related to the immune system is identical. *D*<sub>8</sub> and *D*<sub>9</sub> are identical to the diffusion coefficients of the BCG infected and uninfected cancer cells.

<figure class="table-figure" id="table-3">
<figcaption><strong>Table 3</strong> The model’s parameters.</figcaption>
<div class="table-scroll"><table><tr><th>Parameter</th><th>Value</th><th>Source</th></tr><tr><td>βB</td><td>7.20⋅105</td><td>Guzev et al. (2019)</td></tr><tr><td>βT</td><td>7.50⋅103</td><td>Guzev et al. (2019)</td></tr><tr><td>Γ</td><td>4.70⋅103</td><td>Guzev et al. (2019)</td></tr><tr><td>R</td><td>8.50⋅10−3</td><td>Guzev et al. (2019)</td></tr><tr><td>B</td><td>1.07⋅106</td><td>Guzev et al. (2019)</td></tr><tr><td>Tu(0)</td><td>1.00⋅106</td><td>Guzev et al. (2019)</td></tr><tr><td>i2</td><td>1.00⋅106</td><td>Guzev et al. (2019)</td></tr><tr><td>i2</td><td>1.00⋅106</td><td>Guzev et al. (2019)</td></tr><tr><td>eTb</td><td>1.00⋅104</td><td>Guzev et al. (2019)</td></tr><tr><td>q1</td><td>7.00⋅10−3</td><td>Guzev et al. (2019)</td></tr><tr><td>q2</td><td>1.20⋅10−3</td><td>Guzev et al. (2019)</td></tr><tr><td>μA</td><td>3.80⋅10−3</td><td>Guzev et al. (2019)</td></tr><tr><td>μA1</td><td>4.00⋅10−1</td><td>Guzev et al. (2019)</td></tr><tr><td>μE1</td><td>1.90⋅10−1</td><td>Guzev et al. (2019)</td></tr><tr><td>μE2</td><td>3.40⋅10−3</td><td>Guzev et al. (2019)</td></tr><tr><td>А</td><td>3.70⋅10−6</td><td>Guzev et al. (2019)</td></tr><tr><td>αβT</td><td>1.38⋅10−4</td><td>Guzev et al. (2019)</td></tr><tr><td>αTβ</td><td>6.90⋅10−1</td><td>Guzev et al. (2019)</td></tr><tr><td>μB</td><td>1.50⋅10−1</td><td>Guzev et al. (2019)</td></tr><tr><td>μI2</td><td>1.15⋅101</td><td>Guzev et al. (2019)</td></tr><tr><td>μβ</td><td>1.66⋅102</td><td>Guzev et al. (2019)</td></tr><tr><td>gT</td><td>5.20⋅103</td><td>Guzev et al. (2019)</td></tr><tr><td>G</td><td>1.00⋅1013</td><td>Guzev et al. (2019)</td></tr><tr><td>gI</td><td>1.00⋅105</td><td>Guzev et al. (2019)</td></tr><tr><td>p1</td><td>1.25⋅10−4</td><td>Guzev et al. (2019)</td></tr><tr><td>p2</td><td>0.28⋅10−5</td><td>Guzev et al. (2019)</td></tr><tr><td>p3</td><td>1.03⋅10−10</td><td>Guzev et al. (2019)</td></tr><tr><td>p4</td><td>2.32⋅10−5</td><td>Guzev et al. (2019)</td></tr><tr><td>D1</td><td>1.00⋅10−4</td><td>Lazebnik et al. (2020)</td></tr><tr><td>D2</td><td>7.00⋅10−5</td><td>Lazebnik et al. (2020)</td></tr><tr><td>D3</td><td>7.00⋅10−5</td><td>Lazebnik et al. (2020)</td></tr><tr><td>D4</td><td>7.00⋅10−5</td><td>Lazebnik et al. (2020)</td></tr><tr><td>D5</td><td>7.00⋅10−5</td><td>Lazebnik et al. (2020)</td></tr><tr><td>D6</td><td>7.00⋅10−5</td><td>Lazebnik et al. (2020)</td></tr><tr><td>D7</td><td>7.00⋅10−5</td><td>Lazebnik et al. (2020)</td></tr><tr><td>D8</td><td>6.00⋅10−1</td><td>Lazebnik et al. (2020)</td></tr><tr><td>D9</td><td>6.00⋅10−1</td><td>Lazebnik et al. (2020)</td></tr></table></div>

</figure>

### 7.2 Sensitivity Analysis

The sensitivity of the model to changes in several parameters has been explored. Using the sensitivity analysis it is possible to examine the lim itations and robustness of the model. The parameters in the model that have be explored are *α, β, β*<sub>B</sub>*, r, λ, b,* and *T*<sub>u</sub>(*r, t*<sub>0</sub>) which are chosen because of their biological importance in the treatment protocol. It is known that each parameter has upper and lower boundary values in the scope of this treatment (Shaikhet and Bunimovich-Mendrazitsky, 2018). Figs. (8-12) present the different dynamics of the system for each one of the nine population sizes where the color of each plot defined the value of the considered parameter used in each calculation. The sample values for each parameter {

<div class="equation" id="eq-33"><img src="figures/eq-33.webp" width="711" height="45" alt="are chosen according to the following formula { (ub−lb)k 5 }5 k=0 where ub and lb are the upper and lower bound of a parameter, respectively. The x-axis is" loading="lazy" decoding="async"></div>

the time in days from the beginning of the treatment. The y-axis is the cell’s population size.

Fig. 8 shows the sensitivity of the system to parameter α ranging from 10<sup>3</sup> to 9⋅10<sup>3</sup> with step size 1*.*25⋅10<sup>3</sup>. Each color (and line style) represents a different sample. It is easy to see that there is no change in the population sizes as a function of α.

<figure id="fig-8">
<img src="figures/fig-8.webp" width="734" height="415" alt="Sensitivity of parameter α ranging from 1⋅103 to 9⋅103" loading="lazy" decoding="async">
<figcaption><strong>Fig. 8.</strong> Sensitivity of parameter α ranging from 1⋅10<sup>3</sup> to 9⋅10<sup>3</sup>..</figcaption>
</figure>

Fig. 9 shows the sensitivity of the system to parameter β ranging from 2*.*55⋅10<sup>− 2</sup> to 4*.*25⋅10<sup>− 2</sup> with step size 4*.*25⋅10<sup>− 3</sup>. Sub figures *A*<sub>t</sub> and *A*<sub>b</sub> show that smaller β resulted in a stronger response of the immune system.

<figure id="fig-9">
<img src="figures/fig-9.webp" width="734" height="416" alt="Sensitivity of parameter β ranging from 0.0255 to 0.0425" loading="lazy" decoding="async">
<figcaption><strong>Fig. 9.</strong> Sensitivity of parameter β ranging from 0.0255 to 0.0425..</figcaption>
</figure>

Fig. 10 shows the sensitivity of the system to parameter *b* ranging from 10<sup>5</sup> to 10<sup>8</sup> with step size 1*.*98⋅10<sup>6</sup>. Where *b* is low (blue line) then the tumor cells (*T*<sub>i</sub>*, T*<sub>u</sub>) are increasing and as a result the immune system cells *A*<sub>t</sub>*, E*<sub>t</sub> are increasing in the injection over time as well. It is easy to notice that a too little amount of *b* does not lead to tumour-free equilibrium. As *b* grows, more *T*<sub>u</sub> cells are converted faster to *T*<sub>i</sub> and the immune system’s cell populations grow but converge to some plateau. In addition, sub figures *T*<sub>u</sub> and *A*<sub>b</sub> show inherently different dynamics for different values of *b* which are further analyzed in the bifurcation section.

<figure id="fig-10">
<img src="figures/fig-10.webp" width="734" height="418" alt="Sensitivity of parameter b ranging from 105 to 108" loading="lazy" decoding="async">
<figcaption><strong>Fig. 10.</strong> Sensitivity of parameter <em>b</em> ranging from 10<sup>5</sup> to 10<sup>8</sup>..</figcaption>
</figure>

Fig. 11 shows the sensitivity of the system to parameter *β*<sub>B</sub> ranging from 1*.*08⋅10<sup>4</sup> to 1*.*81⋅10<sup>4</sup> with step size 1*.*45⋅10<sup>3</sup>. Sub Figure *A*<sub>t</sub> shows that *A*<sub>t</sub> decreases as *β*<sub>B</sub> increases while *β*<sub>b</sub> has a minor effect on the other cell populations.

<figure id="fig-11">
<img src="figures/fig-11.webp" width="734" height="418" alt="Sensitivity of parameter βB ranging from 1087500 to 1811200" loading="lazy" decoding="async">
<figcaption><strong>Fig. 11.</strong> Sensitivity of parameter <em>β</em><sub>B</sub> ranging from 1087500 to 1811200..</figcaption>
</figure>

Fig. 12 shows the sensitivity of the system to parameter *r* ranging from 1⋅10<sup>− 3</sup> to 5⋅10<sup>− 1</sup> with step size 1*.*25⋅10<sup>− 2</sup>. As *r* increases the needed time such that the cancer cell population size (*T*<sub>i</sub>*, T*<sub>u</sub>) decay rate is decreasing. Furthermore, for a large enough *r* the system does not converge to a tumor-free equilibrium, as shown in sub figures *T*<sub>u</sub> and *T*<sub>i</sub>. In addition, a small enough *r* results in a more stable immune system reaction *A*<sub>b</sub>*, A*<sub>t</sub>*, A*. Sub Figure *T*<sub>u</sub> shows inherently different dynamics for different values of *r* which are further analyzed in the bifurcation section.

<figure id="fig-12">
<img src="figures/fig-12.webp" width="734" height="415" alt="Sensitivity of parameter r ranging from 1⋅10− 3 to 5⋅10− 1" loading="lazy" decoding="async">
<figcaption><strong>Fig. 12.</strong> Sensitivity of parameter <em>r</em> ranging from 1⋅10<sup>− 3</sup> to 5⋅10<sup>− 1</sup>..</figcaption>
</figure>

## References

- Bhattacharya, S., Sah, P.P., Banerjee, A., Ray, S., 2020. Structural impact due to PPQEE deletion in multiple cancer associated protein - integrin V: an in silico exploration. ABiosystems 104216. [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref1)
- Bj¨orck, Å., 1996. Numerical Methods for Least Squares Problems. SIAM Journal on Scientific and Statistical Computing. Book OT51. [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref1) · [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref2)
- Bray, F., Ferlay, J., Soerjomataram, I., Siegel, R.L., Torre, L.A., Jemal, A., 2018. Global cancer statistics 2018: GLOBOCAN estimates of incidence and mortality worldwide for 36 cancers in 185 countries. CA A Cancer J. Clin. 68 (6), 394–424. [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref2) · [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref3)
- Buis, R.G., 1968. Lyapunov stability for partial differential equations. NASA 1100. [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref3) · [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref4)
- Bunimovich-Mendrazitsky, S., Goltser, Y., 2011. Use of quasi-normal form to examine stability of tumor-free equilibrium in a mathematical model of BCG treatment of bladder cancer. Math. Biosci. Eng. 8, 529–547. [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref4) · [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref5)
- Bunimovich-Mendrazitsky, Pisarev, V., E. Kashdan, E., 2015a. Modeling and simulation of a low-grade urinary bladder carcinoma. Comput. Biol. Med. 58, 118–129. [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref5) · [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref7)
- Bunimovich-Mendrazitsky, S., Halachmi, S., Kronik, N., 2015b. Improving Bacillus Calmette Gu´erin (BCG) immunotherapy for bladder cancer by adding interleukin-2 (IL-2): a mathematical model. Math. Med. Biol. 159–188. [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref7) · [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref8)
- Bunimovich-Mendrazitsky, S., Kronik, N., Vainstein, V., 2019. Optimization of interferon-alpha and imatinib combination therapy for chronic myeloid leukemia: a modeling approach. Adv. Theor. Simul. 1800081. [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref8) · [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref9)
- Coddington, E.A., Levinson, N., 1955. Theory of Ordinary Differential Equations. New York McGraw-Hill. [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref9) · [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref10)
- Eikenberry, S., Thalhauser, C., Kuang, Y., 2009. Tumor-immune interaction, surgical treatment, and cancer recurrence in a mathematical model of melanoma. PLoS Comput. Biol., e1000362 [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref10) · [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref11)
- Eylert, M., Hounsome, L., Persad, R., Bahl, A., Jefferies, E., Verne, J., Mostafid, H., 2014. Falling bladder cancer incidence from 1990 to 2009 is not producing universal mortality improvements. J. Clin. Urol. 7, 90–98. [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref11) · [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref12)
- Fridman, A., Kao, C.Y., 2014. Mathematical Modeling of Biological Processs, Lecture Notes on Mathematical Modeling in the Life Sciences. Springer, Cham. [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref12) · [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref13)
- Grabnar, I., Bogataj, M., Belic, A., Logar, V., Karba, R., Mrhar, A., 2006. Kinetic model of drug distribution in the urinary bladder wall following intravesical instillation. Int. J. Pharma. 52–59. [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref13) · [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref14)
- Guzev, E., Halachmi, S., Bunimovich-Mendrazitsky, S., 2019. Additional extension of the mathematical model for BCG immunotherapy of bladder cancer and its validation by auxiliary tool. Int. J. Nonlinear Sci. Numer. Stimul. 20 (6), 675–689. [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref14) · [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref15)
- Herr, H.W., Laudone, V.P., Badalament, R.A., Oettgen, H.F., Sogani, P.C., Freedman, B. D., Melamed, M.R., Whitmore, W.F., 1988. Bacillus Calmette-Gu´erin therapy alters the progression of superficial bladder cancer. J. Clin. Oncol. 1450–1455. [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref15) · [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref16)
- Hornberg, J.J., Bruggeman, F.J., Westerhoff, H.V., Lankelma, J., 2006. Cancer: a systems biology disease. Biosystems 81–90. [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref17)
- Jord˜ao, G., Tavares, J.N., 2017. Mathematical models in cancer therapy. Biosystems 12–23. [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref17) · [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref18)
- Kirschner, D., Panetta, J.C., 1998. Modeling immunotherapy of the tumor–immune interaction. J. Math. Biol. 37, 235–252. [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref18) · [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref19)
- Lamm, D.L., 2006. Improving patient outcomes: optimal BCG treatment regimen to prevent progression in superficial bladder cancer. Eur. Urol. Suppl. 5, 654–659. [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref19) · [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref20)
- Lazebnik, T., Yanetz, S., Bunimovich-Mendrazitsky, S., Haroni, N., 2020. Treatment of bladder cancer using BCG immunotherapy: PDE modeling. Partial Differ. Equ. [doi:10.26351/FDE/26/3-4/5](https://doi.org/10.26351/FDE/26/3-4/5) · [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref20)
- Matzavinos, A., Chaplain, M.A., Kuznetsov, V.A., 2004. Mathematical Modelling of the Spatio-Temporal Response of Cytotoxic T-Lymphocytes to a Solid Tumour, Mathematical Medicine and Biology, pp. 1–34. [doi:10.26351/FDE/26/3-4/5](https://doi.org/10.26351/FDE/26/3-4/5) · [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref22)
- Morales, A., Eidinger, D., Bruce, A.W., 1976. Intracavity Bacillus Calmette-Gu´erin in the treatment of superficial bladder tumors. J. Urol. 116, 180–183. [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref22) · [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref23)
- Paterson, D.L., Patel, A., 1998. Bactillus calmette-guerin (BCG) immunotherapy for bladder cancer: reivew of complications and their treatment. Aust. N. Z. J. Surg. 340–344. [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref23) · [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref24)
- Redelman-Sidi, G., Glickman, M., Bochner, B., 2014. The mechanism of action of BCG therapy for bladder cancer–a current perspective. Nat. Rev. Urol. 11, 153–162. [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref24) · [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref25)
- Shaikhet, L., Bunimovich-Mendrazitsky, S., 2018. Stability analysis of delayed immune response BCG infection in bladder cancer treatment model by stochastic perturbations. Comput. Math. Methods Med. [doi:10.1155/2018/9653873](https://doi.org/10.1155/2018/9653873) · [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref25)
- Shanock, L.R., Baran, B.E., Gentry, W.A., Pattison, S.C., Heggestad, E.D., 2010. Polynomial regression with response surface analysis: a powerful approach for examining moderation and overcoming limitations of difference scores. J. Bus. Psychol. 543–554. [doi:10.1155/2018/9653873](https://doi.org/10.1155/2018/9653873) · [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref27)
- Simon, M.P., O’Donnell, M.A., Griffith, T.S., 2008. Role of neutrophils in BCG immunotherapy for bladder cancer. Urol. Oncol.: Semin. Orig. Invest. 341–345. [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref27) · [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref28)
- Skeel, R.D., Berzins, M., 1990. A method for the spatial discretization of parabolic equations in one space variable. SIAM J. Sci. Stat. Comput. 11, 1–32. [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref28) · [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref29)
- Wei, H.C., 2016. Polynomial Regression with Response Surface Analysis: A Powerful Approach for Examining Moderation and Overcoming Limitations of Difference Scores, Discrete and Continuous Dynamical Systems - Series B., pp. 1279–1295. [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref29) · [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref30)
- Weiner, A.B., Desai, A.S., Meeks, J.J., 2019. Tumor location may predict adverse pathology and survival following definitive treatment for bladder cancer: a national cohort study. Eur. Urol. Oncol. 2 (Issue 3), 304–310. [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref30) · [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref31)
- Yellasiri, R., Poornima, B., Sridevi, T., 2011. Threshold based edge detection algorithm. Int. J. Eng. Technol. 3. [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref31) · [link](http://refhub.elsevier.com/S0303-2647%2820%2930193-3/sref32)
