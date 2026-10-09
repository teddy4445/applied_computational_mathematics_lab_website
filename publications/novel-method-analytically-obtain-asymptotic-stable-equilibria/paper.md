## 1. Introduction and Related Work

A large group of epidemiological models are extensions of the Susceptible-Infected- Recovered (SIR) model [1]. These models were used for both prediction of the pandemic spread and to find optimal intervention policies for multiple types of diseases, such as polio [2], COVID-19 [3], ebola [4], and influenza [5]. These models use a wide range of analyses and extensions for the SIR model to properly represent the epidemiological and biological properties unique to each disease. One can use these models to obtain multiple intervention policies and the properties of the pandemic dynamics [3], for example, to predict the required number of intensive care units (ICU) to treat all severely infected individuals [6], in order to estimate the influence of the pandemic on the economy [3,7]. Wang et al. [8] provided a review of multiple intervention policies and modeling approaches for the pandemic spread, showing the advantage of the stochastic approach for SIR-type models as compared to deterministic models in representing real-world dynamics.

However, as models become large, it becomes complicated to numerically solve them and to obtain the model analytical properties. A specific property of interest is asymptotic stable equilibria states [9]. The way of obtaining these steps is significantly dependent on the system and its representation. For example, one can obtain the asymptotic stable equilibria states of an ordinary differential equation (ODE) system numerically using a proportional-derivative controller [9]. On the other hand, one may use analytical methods, which first obtain the equilibria states by setting the gradient of the system’s state to zero and then solve them to find the system’s state. In order to find the stability properties of such equilibria, one may use several methods, such as adding errors to the equilibria to show if this either decreases or increases and under which conditions [10]. Another option is to show that under given conditions the eigenvalues of the Jacobin matrix in the equilibria states are negative [2]. An additional common option is using the Lyapunov stability theorem [11–14]. While these methods are useful, they require some level of expertise to understand how to configure a specific dynamic system for each method. Furthermore, these methods first require one to find the equilibria states of the model, which may be a time- and resource-consuming task in itself. Therefore, the analytical analysis of large-scale systems a complex task remains challenging.

One method shown to be useful in modeling dynamics in epidemics is the Markov chain method [15,16]. In the context of epidemics, the Markov chain method represents the dynamics, that is, the rapid spread of the disease in the population, using a transmission matrix [15].

Since the pandemic spread is subject to multiple complex factors whose nature is uncertain [16], and these factors change based on the current state of the disease spread, the Markov chain method is a natural approach to use in order to model such dynamics [17–19]. It was shown that the Markov chain method approximates the deterministic SIR model very well [20,21]. In addition, using the Markov chain method it is possible to obtain multiple analytical properties such as equilibria states and asymptotic states [22].

We propose a novel method to obtain all asymptotic stable equilibria states of an extended SIR for three age groups and for five epidemiological states, which we develop to describe long-term immunity memory in the airborne infection pandemic model [3]. Our method approximates the continuous extended SIR model using a discrete, stochastic, Markov chain representation. The paper is organized as follows. First, we introduce an extended SIR model, consisting of 15 ODEs. Second, we present the asymptotic equilibrium state of the proposed model. Third, we compare the proposed method with a classical method. Finally, we discuss the main advantages and limitations of the proposed method.

## 2. Model Definition

We describe an extended SIR epidemiological model proposed by us in [23], with the addition of the new age group (elderly) and dividing the infection state into asymptomatic and symptomatic subpopulations. A full description of the proposed model is as follows: The model considers a constant population with a fixed number of individuals *N*. Each individual belongs to one of the five subpopulations: susceptible (*S*), infected asymptomatic (*I*<sup>a</sup>), infected symptomatic (*I*<sup>s</sup>), recovered (*R*), and dead (*D*), such that *N* = *S* + *I*<sup>s</sup> + *I*<sup>a</sup> + *R* + *D*, such that each subpopulation is non-negative. When an individual in the susceptible subpopulation (*S*) is exposed to the infection, they are transformed to either the asymptomatic or symptomatic infected subpopulation (*I*<sup>a</sup>, *I*<sup>s</sup>) in rates *β*<sub>a</sub>, *β*<sub>s</sub>. Individuals in the symptomatic infected subpopulation (*I*<sup>s</sup>) stay in this subpopulation on average *d*<sup>s</sup> <sub>I→R</sub> days, after which they are transformed to either the recovered (*R*) or dead (*D*) subpopulation. Therefore, in each time unit, some portion of infected individuals recover while others die or remain seriously ill. Individuals in the asymptomatic infected subpopulation (*I*<sup>a</sup>) stay in this subpopulation on average *d*<sup>a</sup> <sub>I→R</sub> days, after which they are transformed to the recovered subpopulation (*R*). Thus, our extended SIR model that consists of Susceptible, Infected-Asymptomatic, Infected-Symptomatic, Recovered and Deceased subpopulations is called SIIRD. A schematic view of the transition of an individual in the population between the model’s states is shown in Figure 1.

The population is divided into three classes based on age: children, adults, and elderly because these subpopulations experience diseases in varying degrees of severity and have different infection probabilities. Individuals below age *A*<sub>1</sub> are associated with the “children” age class, while individuals below age *A*<sub>2</sub> are associated with the “adult” age class and the complementary subpopulation are associated with the “elderly” age class. The specific threshold ages (*A*<sub>1</sub>, *A*<sub>2</sub>) may differ in different locations but the main goal is to divide the population into three representative age classes. Since it takes *A*<sub>1</sub> years from birth to move from a child to an adult age subpopulation and *A*2 *− A*1 from an adult to the elderly subpopulation, the conversion rate is set as *α*<sub>1</sub> := 1/*A*<sub>1</sub> and *α*<sub>2</sub> := 1/(*A*<sub>2</sub> *− A*<sub>1</sub>). In addition, children are born and the elderly die at a rate unrelated to the pandemic *λ*. We assume that different age groups spend most of their time in separation from each other, which results in a relatively small rate of infected individuals infecting a susceptible individual from different age groups. Therefore, we neglect these dynamics by setting these to zero. By expanding the designation to three age classes, we let *S*<sub>c</sub>, *I*<sup>a</sup> <sub>c</sub> , *I*<sup>s</sup> <sub>c</sub>, *R*<sub>c</sub>, *D*<sub>c</sub>, *S*<sub>a</sub>, *I*<sup>a</sup> <sub>a</sub>, *I*<sup>s</sup> <sub>a</sub>, *R*<sub>a</sub>, *D*<sub>a</sub>, and *S*<sub>e</sub>, *I*<sup>a</sup> <sub>e</sub> , *I*<sup>s</sup> <sub>e</sub>, *R*<sub>e</sub>, *D*<sub>e</sub> to represent the susceptible, asymptomatic infected, symptomatic infected, recovered„ and dead subpopulations for children, adults, and the elderly, respectively, such that

<div class="equation" id="eq-1"><img src="figures/eq-1.webp" width="279" height="60" alt="{x ∈{c, a, e} | Nx := Sx + Ia x + Is x + Rx + Dx}, and N = Σx∈{c,a,e}Nx." loading="lazy" decoding="async"></div>

In addition, we mark *n* = 15 to be the number of the subpopulation in the model. Afterward, in order to obtain the distribution of the subpopulations sizes in the whole population, we divide each subpopulation by the overall size of the population to obtain

<div class="equation" id="eq-2"><img src="figures/eq-2.webp" width="294" height="27" alt="{x ∈{c, a, e}, p ∈{S, Ia, Is, R, D} | px := px/N}." loading="lazy" decoding="async"></div>

Equations (1)–(15) describe the epidemic’s dynamics. In Equation (1), <sup>dSc(t)</sup> is the dynamic amount of susceptible individual children over *dt* time. It is affected by the following four terms. First, at a rate of *β*<sub>cs</sub>, each symptomatic infected child infects susceptible children. Second, at a rate of *β*<sub>ca</sub>, each asymptomatic infected child infects the susceptible children. Third, children grow and pass from the children’s age class to the adult’s age class with a transition rate of *α*<sub>1</sub>, and are removed from the children’s age class. Finally, at a rate of *λ*, the children born and the elderly die, which is not related to the pandemic.

<figure id="fig-1">
<img src="figures/fig-1.webp" width="342" height="419" alt="Schematic view of the three age group SIIRD model with transition between disease stages, divided by age groups" loading="lazy" decoding="async">
<figcaption><strong>Figure 1.</strong> Schematic view of the three age group SIIRD model with transition between disease stages, divided by age groups. Each node is an epidemiological age state in the form of <em>X</em><sub>y</sub>, where <em>X ∈</em> [<em>S</em>, <em>I</em><sup>a</sup>, <em>I</em><sup>s</sup>, <em>R</em>, <em>D</em>] is the epidemiological state and <em>y ∈</em> [<em>c</em>, <em>a</em>, <em>e</em>] is the age group. The edges are the possible transformation, and the value next to them indicates the rate of the population that moves from the source node to the target node. A detailed description of the dynamics is presented in Equations (1)–(15).</figcaption>
</figure>

<div class="equation" id="eq-3"><img src="figures/eq-3.webp" width="495" height="41" alt="dSc(t) dt = −(βcsIs c(t) + βcaIa c (t) + α1)Sc(t) + λ(Se(t) + Is e(t) + Ia e (t) + Re(t)). (1)" loading="lazy" decoding="async"></div>

In Equation (2), <sup>dIsc(t)</sup> is the dynamic amount of symptomatic infected individual *dt* children over time. It is affected by the following four terms. First, at a rate of *β*<sub>cs</sub>, each symptomatic infected child infects the susceptible children. Second, individuals recover from the disease at a rate of *γ*<sub>cr</sub>. Third, individuals die from the disease at a rate of *γ*<sub>cd</sub>. Finally, children grow and pass from the children’s age class to the adult’s age class at a transition rate of *α*<sub>1</sub>, and are removed from the adult’s age class.

<div class="equation" id="eq-4"><img src="figures/eq-4.webp" width="406" height="38" alt="dIs c(t) dt = βcsIs c(t)Sc(t) −(α1 + γcr + γcd)Is c(t). (2)" loading="lazy" decoding="async"></div>

In Equation (3), <sup>dIac (t)</sup> is the dynamic amount of asymptomatic infected individual *dt* children over time. It is affected by the following three terms. First, at a rate of *β*<sub>ca</sub>, each asymptomatic infected child infects the susceptible children. Second, individuals recover from the disease at a rate of *γ*<sub>cr</sub>. Finally, children grow and pass from the children’s age class to the adult’s age class at a transition rate of *α*<sub>1</sub>, and are removed from the adult’s age class.

<div class="equation" id="eq-5"><img src="figures/eq-5.webp" width="390" height="43" alt="dIa c (t) dt = βcaIa c (t)Sc(t) −(α1 + γcr)Ia c (t). (3)" loading="lazy" decoding="async"></div>

In Equation (4), <sup>dRc(t)</sup> is the dynamic amount of recovered individual children over *dt* time. It is affected by the following two terms. First, at each point, a portion of the symptomatic and asymptomatic infected children recover at a rate of *γ*<sub>cr</sub>. Second, children grow from birth and pass from the children’s age class to the adult age class at a transition rate of *α*<sub>1</sub>, and are removed from the children’s age class.

<div class="equation" id="eq-6"><img src="figures/eq-6.webp" width="383" height="41" alt="dRc(t) dt = γcr(Is c(t) + Ia c (t)) −α1Rc(t). (4)" loading="lazy" decoding="async"></div>

In Equation (5), <sup>dDc(t)</sup> is the dynamic amount of dead individual children over time. *dt* It is affected by the symptomatic infected children that die at a rate of *γ*<sub>cd</sub>.

<div class="equation" id="eq-7"><img src="figures/eq-7.webp" width="325" height="41" alt="dDc(t) dt = γcdIs c(t). (5)" loading="lazy" decoding="async"></div>

In Equation (6), <sup>dSa(t)</sup> is the dynamic amount of susceptible adult individuals over *dt* time. It is affected by the following four terms. First, children grow and pass from the children’s age class to the adult’s age class at a transition rate of *α*<sub>1</sub>, and are added to the adult age class. Second, adults grow and pass from the adults’ age class to the elderly age class at a transition rate of *α*<sub>2</sub>, and are removed from the adult’s age class. Third, at a rate of *β*<sub>as</sub>, each symptomatic infected adult infects susceptible adults. Finally, at a rate of *β*<sub>aa</sub>, each asymptomatic infected adult infects susceptible adults.

<div class="equation" id="eq-8"><img src="figures/eq-8.webp" width="420" height="42" alt="dSa(t) dt = α1Sc(t) −(α2 + βasIs a(t) + βaaIa a(t))Sa(t). (6)" loading="lazy" decoding="async"></div>

In Equation (7), <sup>dIsa(t)</sup> is the dynamic amount of symptomatic infected individual *dt* adults over time. It is affected by the following five terms. First, children grow and pass from the children’s age class to the adult’s age class at a transition rate of *α*<sub>1</sub>, and are added to the adult age class. Second, adults grow and pass from the adults’ age class to the elderly age class at a transition rate of *α*<sub>2</sub>, and are removed from the adult’s age class. Third, at a rate of *β*<sub>as</sub>, each symptomatic infected adult infects susceptible adults. Forth, individuals recover from the disease at a rate of *γ*<sub>cr</sub>. Finally, individuals die from the disease at a rate of *γ*<sub>ad</sub>.

<div class="equation" id="eq-9"><img src="figures/eq-9.webp" width="436" height="43" alt="dIs a(t) dt = α1Is c(t) + βasIs a(t)Sa(t) −(α2 + γar + γad)Is a(t). (7)" loading="lazy" decoding="async"></div>

In Equation (8), <sup>dIaa(t)</sup> is the dynamic amount of asymptomatic infected individual *dt* adults over time. It is affected by the following four terms. First, at a rate of *β*<sub>aa</sub>, each asymptomatic infected adult infects susceptible adults. Second, individuals recover from the disease at a rate of *γ*<sub>ar</sub>. Third, children grow and pass from the children’s age class to the adult’s age class at a transition rate of *α*<sub>1</sub>, and are removed from the adult’s age class. Finally, adults grow and pass from the adults’ age class to the elderly age class at a transition rate of *α*<sub>2</sub>, and are removed from the adult’s age class.

<div class="equation" id="eq-10"><img src="figures/eq-10.webp" width="420" height="43" alt="dIa a(t) dt = α1Ia c (t) + βaaIa a(t)Sa(t) −(α2 + γar)Ia a(t). (8)" loading="lazy" decoding="async"></div>

In Equation (9), <sup>dRa(t)</sup> is the dynamic amount of recovered individual adults over time. *dt* It is affected by the following three terms. First, at each point, a portion of the symptomatic and asymptomatic infected adults recover at a rate of *γ*<sub>ar</sub>. Second, children grow from birth and pass from the children’s age class to the adult age class at a transition rate of *α*<sub>1</sub>, and are removed from the children’s age class. Finally, adults grow and pass from the adults’ age class to the elderly age class at a transition rate of *α*<sub>2</sub>, and are removed from the adult’s age class.

<div class="equation" id="eq-11"><img src="figures/eq-11.webp" width="414" height="41" alt="dRa(t) dt = α1Rc(t) + γar(Is a(t) + Ia a(t)) −α2Ra(t). (9)" loading="lazy" decoding="async"></div>

In Equation (10), <sup>dDa(t)</sup> is the dynamic amount of dead individual adults over time. It *dt* is affected by the symptomatic infected adult that dies at a rate of *γ*<sub>ad</sub>.

<div class="equation" id="eq-12"><img src="figures/eq-12.webp" width="327" height="42" alt="dDa(t) dt = γadIs a(t). (10)" loading="lazy" decoding="async"></div>

In Equation (11), <sup>dSe(t)</sup> is the dynamic amount of susceptible elderly individuals over *dt* time. It is affected by the following four terms. First, adults grow and pass from the adults’ age class to the elderly age class at a transition rate of *α*<sub>2</sub>, and are added to the elderly age class. Second, the elderly naturally die at a transition rate of *λ*, and are removed from the elderly age class. Third, at a rate of *β*<sub>es</sub>, each symptomatic infected elderly person infects susceptible elderly people. Finally, at a rate of *β*<sub>ea</sub>, each asymptomatic infected elderly person infects susceptible elderly people.

<div class="equation" id="eq-13"><img src="figures/eq-13.webp" width="417" height="41" alt="dSe(t) dt = α2Sa(t) −(λ + βesIs e(t) + βeaIa e (t))Se(t). (11)" loading="lazy" decoding="async"></div>

In Equation (12), <sup>dIse(t)</sup> is the dynamic amount of symptomatic infected individual *dt* elderly people over time. It is affected by the following five terms. First, adults grow and pass from the adult’s age class to the elderly age class at a transition rate of *α*<sub>2</sub>, and are added to the elderly age class. Second, the elderly naturally die at a transition rate of *λ*, and are removed from the elderly age class. Third, at a rate of *β*<sub>es</sub>, each symptomatic infected elderly person infects susceptible elderly people. Forth, individuals recover from the disease at a rate of *γ*<sub>er</sub>. Finally, individuals die from the disease at a rate of *γ*<sub>ed</sub>.

<div class="equation" id="eq-14"><img src="figures/eq-14.webp" width="432" height="43" alt="dIs e(t) dt = α2Is a(t) + βesIs e(t)Se(t) −(λ + γer + γed)Is e(t). (12)" loading="lazy" decoding="async"></div>

In Equation (13), <sup>dIae (t)</sup> is the dynamic amount of asymptomatic infected individual *dt* elderly people over time. It is affected by the following four terms. First, at a rate of *β*<sub>ea</sub>, each asymptomatic infected elderly person infects susceptible elderly people. Second, individuals recover from the disease at a rate of *γ*<sub>er</sub>. Third, adults grow and pass from the adult’s age class to the elderly age class at a transition rate of *α*<sub>2</sub>, and are removed from the adult’s age class. Finally, the elderly die naturally at a transition rate of *λ*, and are removed from the elderly age class.

<div class="equation" id="eq-15"><img src="figures/eq-15.webp" width="416" height="43" alt="dIa e (t) dt = α2Ia a(t) + βeaIa e (t)Se(t) −(λ + γer)Ia e (t). (13)" loading="lazy" decoding="async"></div>

In Equation (14), <sup>dRe(t)</sup> is the dynamic amount of recovered individual elderly people *dt* over time. It is affected by the following three terms. First, at each point, a portion of the symptomatic and asymptomatic infected elderly people recover at a rate of *γ*<sub>er</sub>. Second, adults grow from birth and pass from the adult’s age class to the elderly age class at a transition rate of *α*<sub>2</sub>, and are removed from the children’s age class. Finally, the elderly naturally die at a transition rate of *λ*, and are removed from the elderly age class.

<div class="equation" id="eq-16"><img src="figures/eq-16.webp" width="410" height="41" alt="dRe(t) dt = α2Ra(t) + γer(Is e(t) + Ia e (t)) −λRe(t). (14)" loading="lazy" decoding="async"></div>

In Equation (15), <sup>dDe(t)</sup> is the dynamic amount of dead individual elderly people over *dt* time. It is affected by the symptomatic infected elderly that die due to the pandemic at a rate of *γ*<sub>ed</sub>.

<div class="equation" id="eq-17"><img src="figures/eq-17.webp" width="325" height="42" alt="dDe(t) dt = γedIs e(t). (15)" loading="lazy" decoding="async"></div>

Therefore, the system takes the following form:

<div class="equation" id="eq-18"><img src="figures/eq-18.webp" width="504" height="548" alt="dSc(t) dt = −(βcsIs c(t) + βcaIa c (t) + α1)Sc(t) + λ(Se(t) + Is e(t) + Ia e (t) + Re(t)), dIsc(t) dt = βcsIs c(t)Sc(t) −(α1 + γcr + γcd)Is c(t), dIac (t) dt = βcaIa c (t)Sc(t) −(α1 + γcr)Ia c (t), dRc(t) dt = γcr(Is c(t) + Ia c (t)) −α1Rc(t), dDc(t) dt = γcdIs c(t), dSa(t) dt = α1Sc(t) −(α2 + βasIs" loading="lazy" decoding="async"></div>

In this notation, the parameters

<div class="equation" id="eq-19"><img src="figures/eq-19.webp" width="460" height="25" alt="P = {βcs, βca, βas, βaa, βes, βea, γcr, γcd, γar, γad, γer, γed, λ, α1, α2}, (17)" loading="lazy" decoding="async"></div>

are rates and define the changes in the population entirely and not on the individual level.

One can model the pandemic dynamics using a stochastic process due to the unstable nature of the parameters of the pandemic used in the model, such as the infection rates (*β*<sub>cs</sub>, *β*<sub>ca</sub>, *β*<sub>as</sub>, *β*<sub>aa</sub>, *β*<sub>es</sub>, *β*<sub>ea</sub>) and recovery rates (*γ*<sub>cr</sub>, *γ*<sub>cd</sub>, *γ*<sub>ar</sub>, *γ*<sub>ad</sub>, *γ*<sub>er</sub>, *γ*<sub>ed</sub>), which differ over time. This is because these models are affected by multiple parameters that are unnecessarily taken into consideration or are even unmeasurable in real-world settings. Therefore, it is possible to treat these parameters as an average probability that an event would happen. Following these assumptions, one can represent the epidemiological dynamics as a transition matrix between two consecutive states of the model, which is represented by an n-dimensional vector, corresponding to the number of subpopulations, as follows:

<div class="equation" id="eq-20"><img src="figures/eq-20.webp" width="350" height="93" alt="⎡ ⎢⎢⎢⎢⎣ Sc(t + h) . . . De(t + h) ⎤ ⎥⎥⎥⎥⎦ = T ⎡ ⎢⎢⎢⎢⎣ Sc(t) . . . De(t) ⎤ ⎥⎥⎥⎥⎦ , (18)" loading="lazy" decoding="async"></div>

where *h ∈* R is an arbitrary small step in time and *T ∈* R<sup>n×n</sup> is the transformation matrix. The model’s state at time *t* is defined by

<div class="equation" id="eq-21"><img src="figures/eq-21.webp" width="655" height="28" alt="M(t) := [Sc(t), Ia c (t), Is c(t), Rc(t), Dc(t), Sa(t), Ia a(t), Is a(t), Ra(t), Da(t), Se(t), Ia e (t), Is e(t), Re(t), De(t)}; (19)" loading="lazy" decoding="async"></div>

therefore, Equation (18) takes the following form:

<div class="equation" id="eq-22"><img src="figures/eq-22.webp" width="328" height="23" alt="M(t + h) = TM(t). (20)" loading="lazy" decoding="async"></div>

The transformation matrix is defined as *T* := *I* + *h*Φ, where

<figure class="table-figure" id="table-x1">
<img src="figures/table-x1.webp" width="692" height="279" alt="Table" loading="lazy" decoding="async">

</figure>

## such that

<div class="equation" id="eq-23"><img src="figures/eq-23.webp" width="192" height="261" alt="φ = ⎛ ⎜ ⎜ ⎜ ⎜ ⎜ ⎜ ⎜ ⎜ ⎜ ⎜ ⎜ ⎜ ⎜ ⎜ ⎜ ⎜ ⎜ ⎜ ⎜ ⎜ ⎜ ⎜ ⎜ ⎜ ⎜ ⎝ −α1 ξcs −α1 −γcr −γcd ξca −α1 −γcr −α1 0 −α2 ξas −α2 −γar −γad ξaa −α2 −γar −α2 0 −λ ξes −λ −γer −γed ξea −λ −γer −λ 0 ⎞ ⎟ ⎟ ⎟ ⎟ ⎟ ⎟ ⎟ ⎟ ⎟ ⎟ ⎟ ⎟ ⎟ ⎟ ⎟ ⎟ ⎟ ⎟ ⎟ ⎟ ⎟ ⎟ ⎟ ⎟ ⎟ ⎠ ," loading="lazy" decoding="async"></div>

where the model’s parameters P (see Equation (17)) are probabilities rather than rates, as they represent the probabilities for state transfer at the individual level. The transformation matrix (*T*) obtained by solving <sup>dM(t)</sup> = Φ*M*(*t*), where <sup>dM(t)</sup> , is taken from Equation (16), *dt dt* after performing linearization on the *β*<sub>kl</sub>*I*<sup>l</sup> <sub>k</sub>*S*<sub>k</sub> terms to be

<div class="equation" id="eq-24"><img src="figures/eq-24.webp" width="389" height="29" alt="k ∈{c, a, e}, l ∈{a, s} : βklIl kSk →ξklIl k, (22)" loading="lazy" decoding="async"></div>

such that *ξ*<sub>kl</sub> = *β*<sub>kl</sub>*S*<sub>k</sub>(*t*). Therefore, the parameter *ξ*<sub>kl</sub> is the probability that an infected individual will infect other individuals in the population, while *β*<sub>kl</sub> is the probability that a suspicious individual will be infected by an infected individual. The parameter *ξ*<sub>kl</sub> changes over time as *S*<sub>k</sub>(*t*) changes over time, but it can be treated as a constant because *ξ*<sub>kl</sub> is a random variable in nature, and so incorporates sufficient variability to capture the dynamics of *S*<sub>k</sub>(*t*) over time. The motivation for using this linearization is that the alternative, *β*<sub>kl</sub>*I*<sup>l</sup> <sub>k</sub>*S*<sub>k</sub> *→ β*<sub>kl</sub>*S*<sub>k</sub>, provides a worse approximation. For example, consider the following case: *k ∈{c*, *a*, *e}*, *l ∈{a*, *s}* : *I*<sup>l</sup> <sub>k</sub> = 0 *∧S*<sub>k</sub> *>* 0. Following the approximation *β*<sub>kl</sub>*I*<sup>l</sup> <sub>k</sub>*S*<sub>k</sub> *→ β*<sub>kl</sub>*S*<sub>k</sub> means that some portion of the suspicious population become infected, which is impossible from an epidemiological perspective. On the other hand, following the linearization in Equation (22) results in *k ∈{c*, *a*, *e}*, *l ∈{a*, *s}* : *I*<sup>l</sup> <sub>k</sub> = 0 in this scenario.

Therefore, matrix *T* is the stochastic, linear, approximation of the transformation between two states of the ODE-based model (see Equation (16)). Nevertheless, the models described in Equation (16) (ODE, the deterministic model) and Equations (20) and (21) (the linear transformation matrix, the stochastic model) analytically differ since in Equation (16), the parameters P can be assigned any real value. While it may no longer describe epidemiological dynamics, the mathematical model is well defined in such a scenario. On the other hand, Equations (20) and (21) required the parameters to be *∀p ∈* P : *p ∈* (0, 1] according to Equation (21), which is a stochastic matrix and therefore satisfies that each row sums to 1. This condition is not met if *∀p ∈* P : *p ∈* (0, 1] does not hold. Therefore, the model represented by Equation (16) includes the model represented by Equations (20) and (21).

However, for the subspace where both models are defined, they are numerically equal for any finite time. Indeed, this is true for a given norm function *|| · ||* : R<sup>n</sup> *→* R, start condition *M*(0), and time interval [0, *t*<sub>max</sub>]. The state of the stochastic SIIRD (Equations (20) and (21)) *M*<sub>s</sub>(*t*) and the state of the deterministic SIIRD (Equation (16)) *M*<sub>d</sub>(*t*) satisfy

<div class="equation" id="eq-25"><img src="figures/eq-25.webp" width="316" height="25" alt="∀t ∈[0, tmax] ∀ϵ &gt; 0∃h &gt; 0 : ||(Ms(t) −Md(t)|| &lt; ϵ," loading="lazy" decoding="async"></div>

where the parameters *{c*, *a*, *e}*, *l ∈{a*, *s}* : *ξ*<sub>kl</sub>(*t*) = *β*<sub>kl</sub>*S*<sub>k</sub>(*t*) are updated at each point in time *t*.

By approximating the deterministic representation (Equation (16)) system using the forward Euler method [24] in each of the states, the approximation introduces *O*(*h*<sup>2</sup>) errors for each step in time. Now, one needs to take <sup>tmax</sup> steps in time to cover [0, *t*<sub>max</sub>], which *h* introduces an overall <sup>tmax</sup> *· O*(*h*<sup>2</sup>) = *O*(*t*<sub>max</sub>*h*) error. Therefore, *||M*<sub>d</sub> *− M*<sub>s</sub>*|| < t*<sub>max</sub>*h*. As *h* a result, for *h < ϵ*/*t*<sub>max</sub>, the condition *∀t ∈* [0, *t*<sub>max</sub>] : *||*(*M*<sub>s</sub>(*t*) *− M*<sub>d</sub>(*t*)*|| < ϵ* is satisfied. Thereafter, we define a stochastic process of the dynamics in Equations (20) and (21) at each point in time (*t*) for each subpopulation *M*<sub>i</sub>(*t*) *∈ M*(*t*), in which there are three possible options for each individual in the population in respect to this subpopulation. First, an individual can be transformed from *M*<sub>i</sub>(*t*) to *M*<sub>j</sub>(*t* + 1) (*i/* = *j ∈* [1, . . . , *n*]) at a probability *α*, which results in Φ<sub>i,j</sub> = *α*. Second, an individual can transform from *M*<sub>j</sub>(*t*) to *M*<sub>i</sub>(*t* + 1) at a probability *ξ*, which results in Φ<sub>j,i</sub> = *ξ* in a symmetric way to the first case. Third, an individual in *M*<sub>i</sub>(*t*) can stay in *M*<sub>i</sub>(*t* + 1). This is a default case and happens at probability 1 *−*Σ<sup>n</sup> <sub>j=1</sub>(Φ<sub>i,j</sub>), which is the complementary probability to all the probabilities of an individual to transform from *M*<sub>i</sub>(*t*). These are the only options possible for an individual in each subpopulation *M*<sub>i</sub>(*t*) as *∀t* : *N* = Σ<sup>n</sup> <sub>i=1</sub>*M*<sub>i</sub>(*t*) is constant in time. Therefore, it is possible to define the transformation between each two states in time as follows:

<div class="equation" id="eq-26"><img src="figures/eq-26.webp" width="519" height="501" alt="Sc(t + h) = (1 −α1)Sc(t) −ξcaIs c(t) −ξcsIa c (t) + λ(Se(t) + Is e(t) + Ia e (t) + Re(t)), Is c(t + h) = (1 −α1 −γcr −γcd + ξcs)Is c(t), Ia c (t + h) = (1 −α1 −γcr + ξca)Is c(t), Rc(t + h) = (1 −α1)Rc(t) + γcr(Is c(t) + Ia c (t)), Dc(t + h) = Dc(t) + γcdIs c(t), Sa(t + h) = (1 −α2)Sa(t) −ξaaIs a(t) " loading="lazy" decoding="async"></div>

The representation in Equation (23) is isomorphic to the one in Equations (20) and (21). However, Equation (23) treats the dynamic as a stochastic process in nature rather than approximating the deterministic ODE-based dynamics while restoring the underline behavior of the epidemiological system.

## 3. Asymptotic Stable Equilibria States

In epidemiology, there are two types of cases that interest decision makers. First, the state of the population in the long term after the end of a pandemic. Second, the equilibria points and their stable or unstable nature.

The state of the population in the long term after the pandemic can be mapped to the asymptotic state of the pandemic in time because after long enough (e.g., *t →* ∞), the population either survives and its regular dynamics are restored or becomes extinct. While the second scenario is trivial as the population is distributed between the different *death* states of the model, the first scenario holds a larger amount of options. Specifically, the pandemic can die out (i.e., the size of the infected population is zero) and, as a result, after a few generations, only susceptible individuals would remain. On the other hand, in some settings, the pandemic may not die out but be kept under control, such that the pandemic converges to a steady state.

The equilibria states are important for decision makers as these promise a scenario that remains the same unless some action is taken or a major event takes place. However, the equilibria states should be divided into two groups. On the one hand, unstable equilibria states provide some level of stability but are still problematic due to their unstable nature, in which even a relatively small change results in a drastic outcome. On the other hand, stable equilibria do not have this issue.

Therefore, in this section, we analyze the model’s asymptotic equilibria states. One may try to obtain the asymptotic equilibria states and their stability properties from the ODE-based representation (e.g., Equation (16)). Nevertheless, this approach would require one to solve a n-dimensional, nonlinear, heterogeneous, ODE system, which is both numerically and analytically complex and time consuming. On the other hand, by defining a nonhomogeneous discrete-time Markov chain represented by the transformation function (Equation (23)) with state space *M*(*t*) (Equation (18)), in respect to the states in Equation (16), one can find the asymptotic equilibrium as follows. First, in order to model the dynamics as a Markov chain, one needs to show that

<div class="equation" id="eq-27"><img src="figures/eq-27.webp" width="446" height="25" alt="P(Mt+h = j|Mt = it, . . . , M0 = i0) = P(Mt+h = j|Mt = it), (24)" loading="lazy" decoding="async"></div>

where *{M}*<sub>t</sub> is a stochastic process with values in the state space for all *t ≥* 0 and all states *i*<sub>0</sub>, . . . *i*<sub>t</sub>, *j*, and *h* is an arbitrary small step in time [25]. *T* satisfies Equation (24) if any value in *M*(*t* + *h*) depends only on the previous state *M*(*t*). Indeed, as *T* does not depend on *t* or any value of *M*(*t*) or the previous state, the condition is satisfied.

Therefore, we show that Equation (23) describes a Markovian process. As a result, given the model’s initial condition (M(0)), the model’s state at some time *t* is defined by *M*(*t*) = *T*<sup>t</sup>*M*(0) [22]. Now, assume any initial condition *M*(0). From Equation (23) and Figure 1, it is possible to see a few subprocesses in the dynamics. First, an individual that at some time *t* reaches a death state (corresponding to lines 5, 10, and 15 in Equation (23)) stays there as the coefficients of *D*<sub>c</sub>, *D*<sub>a</sub>, and *D*<sub>e</sub> is 1 for any parameter’s values. Second, if the pandemic ended, namely, *I*<sup>s</sup> <sub>c</sub> + *I*<sup>a</sup> <sub>c</sub> + *I*<sup>s</sup> <sub>a</sub> + *I*<sup>a</sup> <sub>a</sub> + *I*<sup>s</sup> <sub>e</sub> + *I*<sup>a</sup> <sub>e</sub> = 0, there are two possible cases: the population is extended or some portion of the population (or even the whole population) survived. In the case in which the population is extended, the obtained state is a distribution over the *{D*<sub>c</sub>, *D*<sub>a</sub>, *D*<sub>e</sub>*}* states, while the other subpopulations are 0. In the second option, the population is distributed over the *{S*<sub>c</sub>, *S*<sub>a</sub>, *S*<sub>e</sub>, *R*<sub>c</sub>, *R*<sub>a</sub>, *R*<sub>e</sub>, *D*<sub>c</sub>, *D*<sub>a</sub>, *D*<sub>e</sub>*}* as the infection states are 0. However, after *t >* 1/*α*<sub>1</sub>, all the individuals at *R*<sub>c</sub> transform to *R*<sub>a</sub>. Similarly, after time *t >* 1/*α*<sub>2</sub>, all the individuals at *R*<sub>a</sub> transform to *R*<sub>e</sub>, and finally, after *t > λ*, all the individuals at *R*<sub>e</sub> transform to *S*<sub>c</sub>. As a result, after time *t >* 1/*α*<sub>1</sub> + 1/*α*<sub>2</sub> + 1/*λ*, the subpopulations *R*<sub>c</sub> = *R*<sub>a</sub> = *R*<sub>e</sub> = 0. While at the same time, the remaining population at *S*<sub>c</sub>, *S*<sub>a</sub> and *S*<sub>e</sub> circulate between these states. Finally, in the case in which the pandemic is not finished, after some time *t*, the pandemic will end, as

<div class="equation" id="eq-28"><img src="figures/eq-28.webp" width="163" height="31" alt="∀t : Tt {Isc,Iac ,Isa,Iaa,Ise,Iae }/ = I6×6," loading="lazy" decoding="async"></div>

which means these subpopulations eventually decrease over time. As a result, for any start condition *M*(0), and parameters *∀p ∈* P : *p ∈* (0, 1], at *t →* ∞, the model’s asymptotic state (lim<sub>t→∞</sub> *M*(*t*)) takes the following form:

<div class="equation" id="eq-29"><img src="figures/eq-29.webp" width="393" height="65" alt="S∗ c = ν1, Is∗ c = 0, Ia∗ c = 0, R∗ c = 0, D∗ c = ν2, S∗ a = ν3, Is∗ a = 0, Ia∗ a = 0, R∗ a = 0, D∗ a = ν4, S∗ e = ν5, Is∗ e = 0, Ia∗ e = 0, R∗ e = 0, D∗ e = ν6, (25)" loading="lazy" decoding="async"></div>

where *{ν ≥* 0*}*<sup>6</sup> <sub>i=1</sub> and Σ<sup>6</sup> <sub>i=1</sub>*v*<sub>i</sub> = *N*; and *N* is the total size of the population as defined in Section 2.

The values *{ν}*<sup>6</sup> <sub>i=1</sub> are dependent on the initial conditions and the model’s parameters and are thus complex and time consuming to find. Therefore, Equation (25) defined the (six-dimensional) subspace in which all possible asymptotically stable states of the model are located with the distribution of the population in the state space, which contains the results of all possible outcomes of the model for any initial condition and model parameters. That is to say, once the model’s state takes the form of Equation (25), it stays in this form from this point on.

Therefore, one can take advantage of this property in order to obtain the asymptotic stable equilibria, as they necessarily follow Equation (25). In order to obtain the asymptotic equilibrium state, we set Equation (25) in Equation (18) and obtain

<div class="equation" id="eq-30"><img src="figures/eq-30.webp" width="364" height="261" alt="⎡ ⎢⎢⎢⎢⎢⎢⎢⎢⎢⎢⎢⎢⎢⎢⎢⎢⎢⎢⎢⎢⎢⎢⎢⎢⎢⎣ ν1(1 −α1) + ν5λ 0 0 0 ν2 ν3(1 −α2) + ν1α1 0 0 0 ν4 ν5(1 −λ) + ν3α2 0 0 0 ν6 ⎤ ⎥⎥⎥⎥⎥⎥⎥⎥⎥⎥⎥⎥⎥⎥⎥⎥⎥⎥⎥⎥⎥⎥⎥⎥⎥⎦ ←T ⎡ ⎢⎢⎢⎢⎢⎢⎢⎢⎢⎢⎢⎢⎢⎢⎢⎢⎢⎢⎢⎢⎢⎢⎢⎢⎢⎣ ν1 0 0 0 ν2 ν3 0 0 0 ν4 ν5 0 0 0 ν6 ⎤ ⎥⎥⎥⎥⎥⎥⎥⎥⎥⎥⎥⎥⎥⎥⎥⎥⎥⎥⎥⎥⎥⎥⎥⎥⎥⎦ . (26)" loading="lazy" decoding="async"></div>

It is possible to divide the types of equilibria into two subgroups: where *ν*<sub>1</sub> = *ν*<sub>3</sub> = *ν*<sub>5</sub> = 0 and otherwise. The first option corresponds to the scenario in which the population is extended due to the pandemic. By setting *ν*<sub>1</sub> = *ν*<sub>3</sub> = *ν*<sub>5</sub> = 0 in Equation (27), one can obtain that all combinations of *{ν*<sub>2</sub>, *ν*<sub>4</sub>, *ν*<sub>6</sub>*}*, such that *ν*<sub>2</sub> + *ν*<sub>4</sub> + *ν*<sub>6</sub> = *N*, are in equilibrium. This results in (*N* + 1)<sup>2</sup> for the population in size *N* as it is combinatorially equivalent to dividing *N* items into three (allowing empty) groups. On the other hand, assuming *ν*1*/* = 0, *ν*3*/* = 0, *ν*5*/* = 0, the state is in equilibrium if and only if

<div class="equation" id="eq-31"><img src="figures/eq-31.webp" width="358" height="59" alt="⎡ ⎣ ν1(1 −α1) + ν5λ ν3(1 −α2) + ν1α1 ν5(1 −λ) + ν3α2 ⎤ ⎦= ⎡ ⎣ ν1 ν3 ν5 ⎤ ⎦, (27)" loading="lazy" decoding="async"></div>

which means the asymptotic state is also in equilibrium if the following condition is fulfilled:

<div class="equation" id="eq-32"><img src="figures/eq-32.webp" width="328" height="25" alt="α1ν1 = α2ν3 = λν5. (28)" loading="lazy" decoding="async"></div>

As a result, for any initial condition and the model’s parameters values, there is a time *t*<sub>0</sub> such that for all *t > t*<sub>0</sub>, Equation (25) is fulfilled. In the case in which either *ν*<sub>1</sub> = *ν*<sub>3</sub> = *ν*<sub>5</sub> = 0 or *α*<sub>1</sub>*ν*<sub>1</sub> = *α*<sub>2</sub>*ν*<sub>3</sub> = *λν*<sub>5</sub>, the model is in an asymptotically stable equilibrium state.

## 4. Comparison with Classical Methods

We compare the proposed method shown in Section 3 with a classical method used to obtain equilibria states and their stability properties for dynamic systems [26,27].

### 4.1. Equilibrium

The equilibria states of the model (Equation (16)) are defined as the states of the model in which the gradient is zero. Therefore, Equation (16) takes the form

<div class="equation" id="eq-33"><img src="figures/eq-33.webp" width="424" height="484" alt="−(βcsIs c + βcaIa c + α1)Sc + λ(Se + Is e + Ia e + Re) = 0, βcsIs cSc −(α1 + γcr + γcd)Is c = 0, βcaIa c Sc −(α1 + γcr)Ia c = 0, γcr(Is c + Ia c ) −α1Rc = 0, γcdIs c = 0, α1Sc −(α2 + βasIs a + βaaIa a)Sa = 0, α1Is c + βasIs aSa −(α2 + γar + γad)Is a = 0, α1Ia c + βaaIa aSa −(α2 + γar)Ia a = 0, α1Rc " loading="lazy" decoding="async"></div>

One can notice that from Equations (16) and (29), it follows that

<div class="equation" id="eq-34"><img src="figures/eq-34.webp" width="355" height="28" alt="Is c = 0, Is a = 0, Is e = 0, Dc = ν2, Da = ν4, De = ν6," loading="lazy" decoding="async"></div>

where *ν*<sub>2</sub>, *ν*<sub>4</sub>, *ν*<sub>6</sub> are arbitrary constants such that *{ν*<sub>2i</sub>*}*<sup>3</sup> <sub>i=1</sub> *≥* 0 and ∑<sup>3</sup> <sub>i=1</sub> *ν*<sub>2i</sub> *≤ N*, because if either *I*<sup>s</sup> <sub>c</sub>, *I*<sup>s</sup> <sub>a</sub>, or *I*<sup>s</sup> <sub>e</sub> is not equal zero, then the gradient of *D*<sub>c</sub>, *D*<sub>a</sub>, or *D*<sub>e</sub> is not zero and, therefore, the state is not in equilibrium by definition. Therefore, *I*<sup>s</sup> <sub>c</sub> = 0, *I*<sup>s</sup> <sub>a</sub> = 0, *I*<sup>s</sup> <sub>e</sub> = 0 leads to *D*<sub>c</sub> = *ν*<sub>2</sub>, *D*<sub>a</sub> = *ν*<sub>4</sub>, *D*<sub>e</sub> = *ν*<sub>6</sub> due to Equations (5), (10), and (15). As a result, one is left with

<div class="equation" id="eq-35"><img src="figures/eq-35.webp" width="387" height="162" alt="−(βcaIa c + α1)Sc + λ(Se + Ia e + Re) = 0, βcaIa c Sc −(α1 + γcr)Ia c = 0, γcrIa c −α1Rc = 0, α1Sc −(α2 + βaaIa a)Sa = 0, α1Ia c + βaaIa aSa −(α2 + γar)Ia a = 0, α1Rc + γarIa a −α2Ra = 0, α2Sa −(λ + βeaIa e )Se = 0, α2Ia a + βeaIa e Se −(λ + γer)Ia e = 0, α2Ra + γerIa e −λRe = 0. (30)" loading="lazy" decoding="async"></div>

By setting *I*<sup>a</sup> <sub>c</sub> = 0, *I*<sup>a</sup> <sub>a</sub> = 0, *I*<sup>a</sup> <sub>e</sub> = 0, *R*<sub>c</sub> = 0, *R*<sub>a</sub> = 0, and *R*<sub>e</sub> = 0 in Equation (30), we obtain *α*<sub>1</sub>*S*<sub>c</sub> = *α*<sub>2</sub>*S*<sub>a</sub> = *λS*<sub>e</sub>, which coincides with (28). Hence, we obtain the following equilibrium:

<div class="equation" id="eq-36"><img src="figures/eq-36.webp" width="398" height="25" alt="E = (ν1, 0, 0, 0, ν2, ν3, 0, 0, 0, ν4, ν5, 0, 0, 0, ν6), (31)" loading="lazy" decoding="async"></div>

where *||E||* = *N*.

### 4.2. Centralization and Linearization

Consider the nonlinear differential equation

<div class="equation" id="eq-37"><img src="figures/eq-37.webp" width="316" height="25" alt="˙x(t) = F(x(t)), (32)" loading="lazy" decoding="async"></div>

where *x ∈* R<sup>n</sup>, and *F*(*x*) = 0 has a solution *x*<sup>∗</sup>, which is an equilibrium of Equation (32). Using a new variable *y*(*t*) = *x*(*t*) *− x*<sup>∗</sup>, one can represent Equation (32) in the form

<div class="equation" id="eq-38"><img src="figures/eq-38.webp" width="331" height="25" alt="˙y(t) = F(x∗+ y(t)). (33)" loading="lazy" decoding="async"></div>

The stability of the zero solution of Equation (33) is equivalent to the stability of the equilibrium *x*<sup>∗</sup> in Equation (32).

Using Taylor’s expansion, Equation (33) takes the form

<div class="equation" id="eq-39"><img src="figures/eq-39.webp" width="215" height="25" alt="F(x∗+ y) = F(x∗) + J(x∗)y + o(y)," loading="lazy" decoding="async"></div>

*|o*(*y*)*|* where *J*(*x*<sup>∗</sup>) is the Jacobian matrix of Equation (33) and lim<sub>|y|→0</sub> = 0, *|y|* is the *|y|* Euclidean norm in R<sup>n</sup>, and the equality *F*(*x*<sup>∗</sup>) = 0. Thus, we obtain a linear approximation of Equation (33):

<div class="equation" id="eq-40"><img src="figures/eq-40.webp" width="321" height="26" alt="˙z(t) = J(x∗)z(t). (34)" loading="lazy" decoding="async"></div>

It is easy to check that, for the considered system, the Jacobian matrix *J*(*x*<sup>∗</sup>) coincides with the matrix Φ given in Equation (21). A state is an asymptotic stable state if and only if the matrix is negative as defined for any values of the parameters (Equation (17)). Unfortunately, the matrix Φ is neither diagonal nor triangular and, therefore, one is able to determine if it is negative definite or not by analytically obtaining the determinant and investigating its properties. However, this will result in a 15-ordered polynomial, which is much more time and resource consuming as compared to the method presented in Section 3.

## 5. Conclusions and Future Research Directions

We propose a novel method to analytically obtain all asymptotic stable equilibria states. We present this method for an extended SIR model, for the three age groups SIIRD model. This method is based on the Markov chain model, the parameters of which are deterministic (Equation (23)). Using this representation, one is able to obtain all asymptotic stable equilibrium states of the model for any given start condition and properties using the stationary state (Equation (31)). The method works because there is a symmetry in the time of the population size (e.g., being constant *N*), which allows the system to converge rather than diverge to infinity or to crash into the trivial case of an extended population.

When comparing the proposed method with classical methods of obtaining equilibria and its stability properties, it is clear that for large-scale SIR models, the proposed method is superior for several reasons. First, the classic method requires a certain level of algebraic expertise to solve the equations that describe the dynamics, while the proposed method treats them as a single process and therefore renders the aforementioned process unnecessary. Second, the classic method is not able to identify all asymptotic stable equilibria by itself, as one is required to manually find all equilibria states and investigate each one independently. This process is time and resource consuming. On the other hand, the proposed model analytically obtains all asymptotic stable equilibria, as it finds the stationary state of the stochastic process that represents the dynamics.

Naturally, converting the deterministic biological rate coefficients, such as the recovery rates *γ* or infection rates *ξ*, into transformation probabilities may create cases that do not correspond to the biological dynamics on the individual level, and these should, therefore, be treated with care. For example, a susceptible individual (*p ∈ S*<sub>a</sub>) can be infected and transformed into the asymptomatic infected subpopulation (*I*<sup>a</sup> <sub>a</sub>) at a given time *t*. Immediately afterward, in time *t* + 1, there is a chance *γ*<sub>ar</sub> that the same individual recovers and is transformed to the recovered subpopulation (*R*<sub>a</sub>).

The stochastic representation of pandemic dynamics allows for more flexibility and credibility than when treating model parameters as deterministic values. This is because data often involve uncertainty [16]. This approach allows for pandemic dynamics to be simulated based on an extended SIR model using distributed systems models. This allows additional social [3], non-pharmaceutical and pharmaceutical intervention (NPI/PI) policies [28], and economical policies [7] to be added to the epidemic dynamics.

We plan to extend the proposed method to handle spatio-temporal SIR-type models, in which the spatial dynamics are taking place in either a continues space or discrete space. For the continues case, the pandemic spread dynamics can be described using a system of partial differential equations [29]. For the discrete case, the pandemic spread dynamics can be described using a graph, resulting in a combination of ODE and graph models [8]. In either case, the addition of spatial dynamics (and the walk of population) would require principle changes in the proposed method. In addition, a numerical and analytical investigation of the duration that the dynamics converge to for the asymptotic stable equilibrium from any given initial condition and model’s parameters would need to be studied. Furthermore, a comparison of the numerical solution of the proposed model (Equations (1)–(15)) and the proposed analytical results will be explored.

**Author Contributions:** Conceptualization, T.L.; methodology, T.L.; validation, L.S. and S.B.-M.; formal analysis, T.L. and L.S.; writing—original draft preparation, T.L.; writing—review and editing, S.B.-M.; visualization, T.L.; supervision, S.B.-M.; project administration, S.B.-M. All authors have read and agreed to the published version of the manuscript

**Funding:** This research received no external funding.

**Institutional Review Board Statement:** Not applicable.

**Informed Consent Statement:** Not applicable.

**Data Availability Statement:** Not applicable.

**Conflicts of Interest:** The authors declare no conflict of interest.

## References

1. Kermack, W.O.; McKendrick, A.G. A contribution to the mathematical theory of epidemics. Proc. R. Soc. 1927, 115, 700–721.
2. Bunimovich-Mendrazitsky, S.; Stone, L. Modeling polio as a disease of development. J. Theor. Biol. 2005, 237, 302–315.
3. Lazebnik, T.; Bunimovich-Mendrazitsky, S. The signature features of COVID-19 pandemic in a hybrid mathematical mode— Implications for optimal work-school lockdown policy. Adv. Theory Simul. 2021, 4, 2000298.
4. Chen, W. A Mathematical Model of Ebola Virus Based on SIR Model. In Proceedings of the 2015 International Conference on Industrial Informatics—Computing Technology, Intelligent Technology, Industrial Information Integration, Wuhan, China, 3–4 December 2015; pp. 213–216.
5. Tan, X.; Yuan, L.; Zhou, J.; Zheng, Y.; Yang, F. Modeling the initial transmission dynamics of influenza A H1N1 in Guangdong Province, China. Int. J. Infect. Dis. 2013, 17, e479–e484.
6. Tuite, A.R.; Fisman, D.N.; Greer, A.L. Mathematical modelling of COVID-19 transmission and mitigation strategies in the population of Ontario, Canada. CMAJ 2020, 192, E497–E505.
7. Bethune, Z.A.; Korinek, A. Covid-19 Infection Externalities: Trading off Lives vs. Livelihoods; Working Paper 27009; National Bureau of Economic Research: Cambridge, MA, USA, 2020.
8. Wang, Z.; Bauch, C.T.; Bhattacharyya, S.; d’Onofrio, A.; Manfredi, P.; Perc, M.; Perra, N.; Salathe, M.; Zhao, D. Statistical physics of vaccination. Phys. Rep. 2016, 664, 1–113.
9. Paden, B.; Panja, R. Globally asymptotically stable ‘PD+’ controller for robot manipulators. Int. J. Control 1988, 47, 1697–1712.
10. Ahmed, E.; El-Sayed, A.M.; El-Saka, H.A. Equilibrium points, stability and numerical solutions of fractional-order predator—Prey and rabies models. J. Math. Anal. Appl. 2007, 325, 542–553.
11. Bhat, S.P.; Bernstein, D.S. Lyapunov analysis of semistability. In Proceedings of the 1999 American Control Conference (Cat. No. 99CH36251), San Diego, CA, USA, 2–4 June 1999; Volume 3, pp. 1608–1612.
12. Magal, P.; McCluskey, C.; Webb, G. Lyapunov functional and global asymptotic stability for an infection-age model. Appl. Anal. 2010, 89, 1109–1140.
13. Genesio, R.; Tartaglia, M.; Vicino, A. On the estimation of asymptotic stability regions: State of the art and new proposals. IEEE Trans. Autom. Control 1985, 30, 747–755.
14. Shaikhet, L. Construction of Lyapunov functionals for stochastic difference equations with continuous time. Math. Comput. Simul. 2004, 66, 509–521.
15. Hamra, G.; MacLehose, R.; Richardson, D. Markov chain Monte Carlo: an introduction for epidemiologists. Int. J. Epidemiol. 2013, 42, 627–634.
16. Cortés, J.; El-Labany, S.K.; Navarro-Quiles, A.; Selim, M.M.; Slama, H. A comprehensive probabilistic analysis of approximate SIR-type epidemiological models via full randomized discrete-time Markov chain formulation with applications. Math. Methods Appl. Sci. 2020, 43, 8204–8222.
17. Sharma, S. Markov Chain Monte Carlo Methods for Bayesian Data Analysis in Astronomy. Annu. Rev. Astron. Astrophys. 2017, 55, 213–259.
18. Nix, A.E.; Vose, M.D. Modeling genetic algorithms with Markov chains. Ann. Math. Artif. Intell. 1992, 5, 79–88.
19. Bois, F.Y. GNU MCSim: Bayesian statistical inference for SBML-coded systems biology models. Bioinformatics 2009, 25, 1453–1454.
20. Becker, N. A general chain binomial model for infectious diseases. Biometrics 1981, 37, 251–258.
21. Allen, L.J.S. An Introduction to Stochastic Processes with Applications to Biology; CRC Press: New York, NY, USA, 2010.
22. Privault, N. Understanding Markov Chains; Springer: Singapore, 2018.
23. Lazebnik, T.; Shami, L.; Bunimovich-Mendrazitsky, S. Spatio-Temporal Influence of Non-Pharmaceutical Interventions Policies on Pandemic Dynamics and the Economy: The Case of COVID-19. Res. Econ. 2021, [doi:10.1080/1331677X.2021.1925573](https://doi.org/10.1080/1331677X.2021.1925573)
24. Press, W.H.; Flannery, B.P.; Teukolsky, S.A.; Vetterling, W.T. Numerical Recipes in FORTRAN: The Art of Scientific Computing; Cambridge University Press: Cambridge, UK, 1992; pp. 710–710.
25. Bremaud, P. Non-Homogeneous Markov Chains; Springer: Berlin/Heidelberg, Germany, 2020; Voume 31, pp. 399–422.
26. Shaikhet, L. About one method of stability investigation for nonlinear stochastic delay differential equations. Int. J. Robust Nonlinear Control 2021, 31, 2946–2959.
27. Beretta, E.; Kolmanovskii, V.; Shaikhet, L. Stability of epidemic model with time delays influenced by stochastic perturbations. Math. Comput. Simul. 1998, 45, 269–277.
28. Zhao, S.; Stone, L.; Gao, D.; Musa, S.S.; Chong, M.K.C.; He, D.; Wang, M.H. Imitation dynamics in the mitigation of the novel coronavirus disease (COVID-19) outbreak in Wuhan, China from 2019 to 2020. Ann. Transnatl. Med. 2020, 8, 448.
29. Di Domenico, L.; Pullano, G.; Sabbatini, C.E.; Bo Elle, P.Y.; Colizza, V. Impact of lockdown on COVID-19 epidemic in Ile-de-France and possible exit strategies. BMC Med. 2020, 18, 240.
