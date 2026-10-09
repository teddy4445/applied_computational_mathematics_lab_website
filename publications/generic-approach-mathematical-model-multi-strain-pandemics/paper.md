## 1 Introduction and related work

Over the centuries, humanity has experienced multiple types of disasters [1–4]. One of them is pandemics (local and global) that cause significant mortality [5]. Moreover, recent studies show that the occurrence rate of new pandemics has increased in the last century, resulting in an increased number of pandemics and their influence [6]. Some of these pandemics exert a global influence such as HIV/AIDS that killed 680 thousand individuals only in 2020 according to the World Health Organization (WHO) or the COVID-19 pandemic that killed 4.5 million individuals and infected around 440 million individuals worldwide during its first 18-months starting in early 2019 [7]. As a result, the need for policymakers to be able to control the spread of a pandemic is becoming more relevant by the day [8].

Moreover, due to multiple socioeconomic processes, there is an increase in the speed at which new infections are spread [9]. To be exact, globalization has facilitated strain spread among countries through the growth of trade and travel [10]. Diseases are usually caused by pathogenic agents, including viruses and bacteria, which can be denoted as multiple variants, generally named strains. The emergence of a multi-strain pathogen imposes a new challenge to control the spread of disease [11]. Since new strains occur as it reproduces in new hosts, the large population of infected individuals offers a fertile ground for new strains to appear [12, 13]. For example, in the case of COVID-19, already in the first year and a half of the pandemic, four (globally common) strains were detected [7].

Most diseases have several pathogenic strains, which can make it difficult to fight the disease and lead to complex dynamics. However, their dynamic properties have not been adequately studied [11]. Hence, a better understanding of future pandemics with several strains is a necessary step to ensure the ability of the global community in handling the next pandemic. One approach to tackle this challenge is using epidemiological-mathematical models, which allows us to simulate and investigate multiple scenarios in a safe, cheap, and manageable environment. A large portion of these epidemiological models are based on the Susceptible-Infectious- Removed (*SIR*) model [14]. Over the years, researchers have introduced different extensions to the *SIR* model in order to obtain a more accurate model for biological [15], economic [16, 17] spatial [18–20], and pandemic management [8, 21, 22] properties of a particular disease or socio-epidemiological scenario. These extensions are natural as the *SIR* disease transmission model is derived assuming multiple strong assumptions. For example, the *SIR* model assumes that the population is large and dense or that the infection rate is constant [14]. The authors extend this basic model in many directions by relaxing some assumptions. As such, the mathematical analysis quickly becomes significantly more sophisticated [23].

Cooper et al. [24] used the *SIR* model on the COVID-19 pandemic while relaxing the assumption that the population is mixing homogeneously and that the total population is constant in time. The authors show that the model has a fair fitting on six countries (China, South Korea, India, Australia, USA, Italy).

Another extension of the *SIR* model for the Polio pandemic is proposed by Agarwal and Bhadauria [25]. The authors introduced the fourth stage—vaccinated individuals, resulting in a *SIRV* model. The numerical simulation of the model results in a promising outcome. Nonetheless, the evaluation is limited to a small size (up to a few hundred individuals), and the generalization to larger populations can be less accurate due to the increased chance that a strain occurs during the pandemic and changes its dynamics [13].

Similarly, Bunimovich-Mendrazitsky and Stone [26] proposed a two-age group, extension (adults and children), for the Polio pandemic spread. Using the model in [26], the extraordinary jump in the number of paralytic polio cases that emerged at the beginning of the 20th century can be explained. The model does not take into consideration some strains of Polio [27] which results in an increased divergence from the actual dynamics over time.

In addition, one of the main extensions of the *SIR* model is the *SIRD* (D-Dead) model, as this model is able to represent the reinfection process and the death of individuals due to the pandemic [28–30]. This model better represents the biological-clinical dynamics in human populations as the long-term immunity memory is reduced over time making the individual susceptible again [31, 32]. We based our model on this extension as it allows reinfection in several strains of the original strain.

The mentioned models and other models that extend the *SIR* model can fairly fit and predict the course of a pandemic’s spread [33, 34]. However, the models are not fitted to capture sharp changes in the dynamics due to pandemic modifications. One reason is the lack of modelization in multi-strain pandemics.

Indeed, the occurrence of pandemics with multiple mutations is common. For example, Minayev and Ferguson [35] investigate the interaction between epidemiological and evolutionary dynamics for antigenically variable pathogens. The authors proposed a set of relatively simple deterministic models of the transmission dynamics of multi-strain pathogens which provide increased biological realism. However, these models assume clinical-epidemiological dynamics that hold only for a subset of pathogens with cross-immunity of less than 0.4 [35]. In a similar manner, Dang et al. [36] developed a multi-scale immuno-epidemiological model of influenza viruses including direct and environmental transmission. The authors showed how two time-since-infection structural variables outperform classical SIR models of influenza. During the modelization, they used a within-host model that holds only for the influenza pandemic. In addition, Gordo et al. [12] proposed a *SIRS* model with reinfection and selection with two strains. The authors used a metapopulation of individuals where each individual is depicted as a vector in the metapopulation. This model has been validated on the influenza pandemic in the State of New York (USA), based on the genetic diversity of influenza gathered between 1993 and 2006, showing superior results compared to other *SIR*-based models [12]. Nonetheless, the sophistication of the model is both in its strength and shortcoming, from an analytical point of view, due to its stochastic and chaotic nature.

Moreover, the usage of multi-strain models that are used for specific pathogens is not restricted to influenza. Marquioni and de Aguiar [37] proposed a model where a pandemic starts with a single strain and the other strains occur in a stochastic manner as a by-product of the infection. The authors fitted their model onto the COVID-19 pandemic in China showing improved results when strain dynamics are taken into consideration compared to the other case [37]. Likewise, Khayar and Allali [38] proposed a *SEIR* (E-exposed) model for the COVID-19 pandemic with two strains. The authors analyzed the influence of the delay between exposure and becoming infectious on several epidemiological properties. Furthermore, they proposed an extension to the model (in the *Single and two mutations model* S1 Appendix) for multi-strain dynamics. In their model, an individual can be infected only once and develop immunity to all strains [38]. In our model, we relax this assumption, allowing individuals to be infected once by each strain. Comparably, Gubar et al. [39] proposed an extended *SIR* model with two strains with different infection and recovery rates. The authors considered a group of latent individuals who are already infected but do not have any clinical symptoms.

In addition, Arruda et al. [40] proposed an *SEIR* model with an arbitrary number of mutations and reinfection of the same strain dynamics. The authors proposed an optimal control for the non-pharmacological lockdown policy and validated their model (with and without mitigation) on the COVID-19 pandemic for both England and the state of Amazonas, Brazil. The authors showed that their model can derive optimal mitigation strategies for any number of viral strains, whilst also evaluating the effect of distinct mitigation costs on the infection levels. On the one hand, Arruda et al.’s model takes into consideration an exposed phase (which is commonly found in multiple pandemics [38, 41]) and reinfection of the same strain after some period of time which are not included in our model. On the other hand, their model does not take into consideration the order of infection by different strains which is one of the main contributions of our model.

Furthermore, Fudolig et al. [42] proposed a multi-strain *SIR* based model with selective immunity by vaccination. The authors examined the influence of the introduction of a new strain. In particular, the authors examined the case where a new strain emerges in the population while the preexisting strain is near to extinction or reached a global equilibrium. The emergence of strains during the pandemic rather at the beginning, as suggested by the proposed model, is more realistic. However, it is not in the scope of the proposed model which aims to study the properties of a static number of strains.

Correspondingly, Aleta et al. [43] extended the SIRS model on a metapopulation where individuals are distributed in sub-populations connected via a network of mobility flows. They show that spatial fragmentation and mobility play a key role in the persistence of the disease the maximum of which is reached at intermediate mobility values. Their model assumes a fixed number of locations (using a graph-based model) such that each location has a unique strain-like simulation. Furthermore, Di Giamberardino et al. [44] proposed a multi-group model formed by interconnected SEIR-like structures which include asymptomatic infected individuals. The authors fitted the data to the COVID-19 pandemic in Italy to study the influence of different IPs on the pandemic spread. The interconnection between the groups in the model is represented by the mobility of individuals between them. The model somewhat represents multi-strains as each group has different epidemiological parameter values and the transformation between them. However, the authors do not handle the case where an individual has been infected by one strain and later infected by others which are known from multiple clinical and biological studies [45–48]. Khyar and Allali [38] studied the global stability of the two-strain epidemic model, extending the *SEIR* with two types of exposed and infected individuals, with two general incidence functions. The authors investigate the basic reproduction number of each strain separately and its effect on the disease-free equilibrium. Roche et al. [49] proposed a stochastic individual-based model for avian influenza viruses, implemented using the agent-based approach. The authors show that their model extends the stochastic SIR model for multi-strain pandemics. Nevertheless, this approach is stochastic in nature, which makes the analytical investigation difficult for multiple pandemic parameters, such as stability and bifurcation.

In this research, we developed an extension of the *SIRD*-based model which allows an arbitrary number of strains |*M*| that originated from a single strain and is generic for any type of pathogen. The model allows each strain to have its unique epidemiological properties. In addition, we developed a computer simulation that provides an *in silico* tool for evaluating several epidemiological properties such as the mortality rate, max infections, and average basic reproduction number of a pandemic. The proposed model allows for a more accurate investigation of the epidemiological dynamics while keeping the data required to use the model relatively low. The main contribution of the proposed model compared to other *SIR*-based multi-strain models is two-fold: the proposed model does not assume any pathogen-specific properties keeping it as generic as possible by the standard *SIR* model and the order of infection from different strains is taken into consideration.

This paper is organized as follows: In Section 2, we introduce our multi-strain epidemiological model. Based on the model, we present a numerical analysis of three epidemiological properties as a function of the number of strains (|*M*|). In Section 3, we present the implementation of the model for the case of two strains (|*M*| = 2) and provide an analytical analysis of the stable equilibria states of the model and a basic reproduction number analysis. Afterward, we show the ability of the model to fit historical epidemiological data known to have two strains. In Section 4, we discuss the main advantages and limitations of the model and propose future work.

## 2 Multi-strain model

The multi-strain epidemiological model considers a constant population with a fixed number of individuals *N*. We assume a pandemic has *M* ≔{1, . . ., *m*} strains. Moreover, two options are possible: a) strains [2, . . .*m*] are mutations arising from one pathogen as a result of the mutation process; b) the disease is characterized by the emergence of *m* pathogenic strains but an individual cannot be infected by more than one strain of the virus at a time.

Each individual belongs to one of the three groups: 1) Infectious with strain *i* ∈ *M* and history of recoveries *J* ∈ *P*(*M*) (the power set of the strain and its strain set) represented by *R*<sub>J</sub>*I*<sub>i</sub>, which maps to the infection (I) state in the *SIRD* model; 2) Recovered with history *J* ∈ *P*(*M*) represented by *R*<sub>J</sub>, which maps to the recovered (R) state in the *SIRD* model; and 3) Dead (*D*) such that

<div class="equation" id="eq-1"><img src="figures/eq-1.webp" width="405" height="26" alt="N = ∑J∈P(M\{i});i∈M(RJIi(t)) + ∑J∈P(M)(RJ(t)) + D(t); (1)" loading="lazy" decoding="async"></div>

where *i* ∈ *M* is the index of a strain and *J* ∈ *P*(*M*) is the set of strains an individual already suffered from. For example, *R*<sub>∅</sub> is the group of individuals that do not have a recovery history and are susceptible to all |*M*| strains which is a private case of *R*<sub>J</sub> where *J* = ∅, which is isomorphic to the susceptible (S) state in the *SIRD* model. The proposed model for |*M*| = 1 is isomorphic to the *SIRD* model (the proof is provided in the Section 2 in S1 Appendix). A schematic transition between disease stages of an individual is shown in Fig 1.

Individuals in the Recovered (*R*<sub>J</sub>) group have immunity for the strains *k* ∈ *J* and are susceptible to the infection strains *M*\\*J*. When an individual in this group is exposed to a strain *i* ∈ *M*\\*J*, the individual is transferred to the Infectious with history of recoveries group (*R*<sub>J</sub>*I*<sub>i</sub>) at a rate *β*<sub>J,i</sub>. The individual stays in this group on average *γ*<sub>J,i</sub> days, after which the individual is transferred to the Recovered group (*R*<sub>J ∪ {i}</sub>) or the Dead group (*D*). Therefore, at a rate of (1 − *ϕ*<sub>J\\i</sub>), of infection by strain *i* with a history of recoveries from strains *J*, individuals remain seriously ill or die while others recover. The recovered are again healthy, no longer contagious, and immune from future infection of the same strain. The epidemiological dynamics are described in Eqs (2)–(4).

*dRJIi*(*t*) In Eq (2), is the dynamical amount of individuals that recovered from a group of *dt* strains *J* and are infected with a strain *i* over time. It is affected by the following two terms. First, individuals who recovered from group *J* of strains become infected with strain *i*, with rate *β*<sub>J,i</sub>. These individuals can be infected by any individual with a strain *i* who has recovered from any group *K* of strains so that *i =*∈ *K*. Second, individuals recover from strains *J* ∪ {*i*} with rate *γ*<sub>J,i</sub>. For each strain *i*, the group *i* can be any subgroup of the group *M*, so that *i =*∈ *J*.

*dR*<sub>J</sub>*I*<sub>i</sub>(*t*) ∑ = − γ<sub>J;i</sub>*R*<sub>J</sub>*I*<sub>i</sub>(*t*) + β<sub>J;i</sub>*R*<sub>J</sub>(*t*) *R*<sub>K</sub>*I*<sub>i</sub>(*t*)*:* (2) *dt K*∈*P*(*M*)*;i=*∈*K* https://doi.org/10.1371/journal.pone.0260683.g001 *dRJ*(*t*) In Eq (3), <sub>dt</sub> is the dynamical amount of individuals that recovered from a group of strains *J* ∈ *P*(*M*) over time. It is affected by the following two terms. First, for each strain *i* ∈ *J*, an individual who has recovered from group *J*\\{*i*} of strains and is infected with strain *i*, recovers at rate *γ*<sub>J\\{i},i</sub> with probability of *ϕ*<sub>J\\{i},i</sub>. Second, individuals infected by strain *i* with rate *β*<sub>J,i</sub>. These individuals can be infected by any individual with a strain *i* who has recovered from any group *K* of strains, so that *i =*∈ *K*.

<figure id="fig-1">
<img src="figures/fig-1.webp" width="851" height="397" alt="Schematic view of transition between disease stages" loading="lazy" decoding="async">
<figcaption><strong>Fig 1. Schematic view of transition between disease stages.</strong> The red arrows indicates that individuals from the source stage can be transferred to the dead stage. Individuals in <em>R</em><sub>J</sub><em>I</em><sub>i</sub> stages are necessarily transferred to the respective <em>R</em><sub>J∪i</sub> stages (or dead stage), while individuals in the <em>R</em><sub>J</sub> stages move to <em>R</em><sub>J</sub><em>I</em><sub>l</sub> stage if they are infected by an individual that is infectious in strain <em>l</em> ∈ <em>M</em>.</figcaption>
</figure>

<div class="equation" id="eq-2"><img src="figures/eq-2.webp" width="459" height="51" alt="dRJ(t) dt = ∑ i∈J γJ\{i};iJ\{i};iRJ\{i}Ii(t) ( ) − ∑ i∈M\J βJ;iRJ(t) ∑ K∈P(M);i=∈K RKIi(t) : (3)" loading="lazy" decoding="async"></div>

In Eq (4), <sup>dD(t)</sup> <sub>dt</sub> is the dynamical amount of dead individuals over time. For each strain *i*, and for each group *J*\\{*i*}, infected individuals that do not recover are dying at rate *γ*<sub>J\\{i},i</sub> with the complete probability (1 −*ϕ*<sub>J\\{i},i</sub>).

<div class="equation" id="eq-3"><img src="figures/eq-3.webp" width="387" height="48" alt="dD(t) dt = ∑ i∈M;J∈P(M) γJ\{i};i(1 − J\{i};i)RJ\{i}Ii(t): (4)" loading="lazy" decoding="async"></div>

The dynamics of Eqs (2)–(4) are summarized in Eq (5).

<div class="equation" id="eq-4"><img src="figures/eq-4.webp" width="479" height="116" alt="dRJIi(t) dt = − γJ;iRJIi(t) + βJ;iRJ(t)∑ K∈P(M);i∈KRKIi(t); dRJ(t) dt = ∑ i∈J(γJ\{i};iJ\{i};iRJ\{i}Ii(t)) − ∑ i∈M\J(βJ;iRJ(t)∑ K∈P(M);i∈KRKIi(t)); dD(t) dt = ∑ i∈M;J∈P(M)γJ\{i};i(1 − J\{i};i)RJ\{i}Ii(t); (5)" loading="lazy" decoding="async"></div>

The initial conditions of Eq (5) are defined for the beginning of a pandemic as follows:

*R* (0) = *N* − *m;* ∀*i* ∈ *M* : *R I*<sub>i</sub>(0) = 1*;* ∀*J* ∈ *P*(*M*)\\ ∧ *i* ∈ *M*\\*J* : *R*<sub>J</sub>(0) = *R*<sub>J</sub>*I*<sub>i</sub>(0) = 0*; D*(0) = 0*:* (6)

### 2.1 Epidemiological properties

Based on the proposed model, and since for all the cases where |*M*| *>* 2 it is extremely hard (or even impossible) to obtain an analytical result, we evaluated three important epidemiological properties to see the influence of the number of strains on the pandemic spread: mean basic reproduction number [50], mortality rate [51, 52], and a maximum number of the infectious [16, 53]. Formally, these properties can be defined as follows.

First, the *mean basic reproduction number* is the mean of the basic reproduction number over time during the course of the pandemic. Therefore, it takes the form:

<div class="equation" id="eq-5"><img src="figures/eq-5.webp" width="313" height="50" alt="E[R0(t)]≔E ∀J ∈ P(M) : ∑i∈M RJIi(t + 1) − RJIi(t) RJ;i(t + 1) − RJ;i(t) :" loading="lazy" decoding="async"></div>

Second, the *mortality rate* is defined as the number of deaths due to the pandemic divided by the number of infections at some period of time. If not stated otherwise, we assume the mortality rate refers to the entire duration of the pandemic. Hence, it takes the form:

<div class="equation" id="eq-6"><img src="figures/eq-6.webp" width="284" height="43" alt="mortality rate(t0; t1)≔ D(t1) − D(t0) ∑J∈P(M)|J| ∗ (RJ(t1) − RJ(t0) :" loading="lazy" decoding="async"></div>

Finally, the *maximum number of infectious* refers to the cumulative number of infections that occur during the pandemic. Thus, it takes the form:

maximum number of infectious(*t*<sub>0</sub>*; t*<sub>1</sub>)≔max <sub>t∈[t0;t1]</sub>(∀*J* ∈ *P*(*M*) : ∑<sub>i∈M</sub>(*R*<sub>J</sub>*I*<sub>i</sub>(*t*)))*:*

In addition, we define the *most aggressive* strain using the following metric: a strain *k* is considered more aggressive than strain *l* if and only if:

\||[∀*J* ∈ *P*(*M*) : (β<sub>J;k</sub>*;* 1 − γ<sub>J;k</sub>*;* 1 − <sub>J;k</sub>)]|| *>* ||[∀*J* ∈ *P*(*M*) : (β<sub>J;l</sub>*;* 1 − γ<sub>J;l</sub>*;* 1 − <sub>J;l</sub>)]||*;*

using the *L*<sub>3</sub> norm. The motivation of this metric is that a higher infection rate, longer recovery rate, and higher death rate are associated with a more aggressive strain. However, due to the complexity of the pandemic’s spread dynamics, it is not straightforward which one of these properties is more important if any, and therefore the comparison between two strains is performed on the three properties simultaneously.

### 2.2 Numerical simulation

Using numerical simulation we aim to study the connection between the number of strains |*M*| and the proposed epidemiological properties. We numerically solved the model presented in Eq (5) for the case where |*M*|∈ [1, . . ., 10] using the fourth-order Runge-Kutta algorithm [54]. The model parameters are generated randomly as follows. The infection rates *β*<sub>J,i</sub> are uniformly distributed in [0.01, 0.10]; the recovery rates *γ*<sub>J,i</sub> are uniformly distributed in [0.03, 0.33]; and the recovery probabilities *ϕ*<sub>J,i</sub> are uniformly distributed in [0.90, 0.99] for each strain. The ranges were picked to simulate a large space of possible pandemics, without taking into consideration biological properties associated with cross-immunity between strains. In addition, we assume the population size is 10 million individuals to approximate (in order of magnitude) a European metropolitan area. The simulation begins with one person getting infected by each strain. In addition, it is assumed that no individuals have recovered or died at the beginning of the pandemic. Formally, the initial conditions take the form:

*R* (0) = *N* − |*M*|*;* ∀*i* ∈ *M* : *R I*<sub>i</sub>(0) = 1*; D*(0) = 0*;* ∀*J* ∈ *P*(*M*)\\ *; i* ∈ *M* : *R*<sub>J</sub>*I*<sub>i</sub> = *R*<sub>J</sub> = 0*:*

Moreover, due to the stochastic nature of the simulation originating in the large ranges of values allocated to the model parameters, the simulation is repeated 1000 times, and the mean ± standard division is presented. Using this generation we compute the connection between |*M*| and the mean basic reproduction number, max infected individuals, and mean mortality rate.

The *mean basic reproduction number* (*E*[*R*<sub>0</sub>]) has been evaluated for each simulation, divided into two cases: the case where each strain has unique parameter values and the case where the parameters of these strains are replaced with the parameter value of the most aggressive strain, defined in Section 2.1, as shown in Fig 2.

The *maximum number of infected individuals* as a function of the number of strains (|*M*|) has been computed and shown in Fig 3. The solid (black) line with the dots represents the numerically calculated values with one standard deviation. Moreover, the fitting function is calculated using the least mean square (LMS) method [55] and shown as the dashed (blue) line. In order to use the LMS method, one needs to define the family function approximating a function. The family function that has been chosen is *f*(*m*) = *p*<sub>1</sub> *log*(*m*)+ *p*<sub>2</sub>, resulting in

<div class="equation" id="eq-7"><img src="figures/eq-7.webp" width="360" height="24" alt="E[R0](m) = 0:103log(m) + 0:068: (7)" loading="lazy" decoding="async"></div>

The fitting function was obtained with a coefficient of determination *R*<sup>2</sup> = 0.79.

<figure id="fig-2">
<img src="figures/fig-2.webp" width="486" height="373" alt="The mean base reproduction number (E[R0(t)]) as a function of the number of strains (|M|)" loading="lazy" decoding="async">
<figcaption><strong>Fig 2. The mean base reproduction number (<em>E</em>[<em>R</strong></em><sub>0</sub><strong>(<em>t</em>)]) as a function of the number of strains (|<em>M</em>|).</strong> The black (with circle markers) line indicates the baseline dynamics of the simulation where each strain has unique parameter values. On the other hand, the red (with triangle markers) line indicates the case where all the strain parameters values have been replaced with one of the most aggressive strains. The results are mean ± standard division for <em>n</em> = 1000 repetitions.</figcaption>
</figure>

https://doi.org/10.1371/journal.pone.0260683.g002 https://doi.org/10.1371/journal.pone.0260683.g003 https://doi.org/10.1371/journal.pone.0260683.g004

The *mean mortality rate* as a function of the number of strains has been computed and presented in Fig 4. Similarly, the dots are the calculated values from the simulator and the dotted line is a fitting function that is computed using the LMS with the family function *f*(*m*) = *p*<sub>1</sub>*log*(*m*) + *p*<sub>2</sub>, resulting in

<div class="equation" id="eq-8"><img src="figures/eq-8.webp" width="367" height="24" alt="E[R0](m) = 0:0341log(m) + 0:0124: (8)" loading="lazy" decoding="async"></div>

The fitting function was obtained with a coefficient of determination *R*<sup>2</sup> = 0.89.

<figure id="fig-3">
<img src="figures/fig-3.webp" width="486" height="374" alt="Maximum number of infectious individuals at the same time as a function of the number of strains (|M|)" loading="lazy" decoding="async">
<figcaption><strong>Fig 3. Maximum number of infectious individuals at the same time as a function of the number of strains (|M|).</strong> The results are mean ± standard division for <em>n</em> = 1000 repetitions.</figcaption>
</figure>

<figure id="fig-4">
<img src="figures/fig-4.webp" width="486" height="369" alt="Mortality rate as function of the number of strains (|M|)" loading="lazy" decoding="async">
<figcaption><strong>Fig 4. Mortality rate as function of the number of strains (|<em>M</em>|).</strong> The results are mean ± standard division for <em>n</em> = 1000 repetitions.</figcaption>
</figure>

## 3 Two strain model

The two strain epidemiological model considers a constant population with a fixed number of individuals *N*. We assume a pandemic has two strains *M* = {1, 2}. We define a system of eight ordinary differential equations (ODEs) corresponding to eight possible epidemiological states: susceptible (*R*<sub>∅</sub>), infected by strain 1 (*R*<sub>∅</sub>*I*<sub>1</sub>), infected by strain 2 (*R*<sub>∅</sub>*I*<sub>2</sub>), recovered from strain 1 (*R*<sub>{1}</sub>), recovered from strain 2 (*R*<sub>{2}</sub>), recovered from strain 1 and infected by strain 2 (*R*<sub>{1}</sub>*I*<sub>2</sub>), recovered from strain 2 and infected by strain 1 (*R*<sub>{2}</sub>*I*<sub>1</sub>), recovered from both strains (*R*<sub>{1,2}</sub>), and dead (*D*). The full explanation of how one obtains the model is provided in the Section 1 in S1 Appendix. A schematic transition between disease stages of an individual for the case of |*M*| = 2 is shown in Fig 5. Thus, the model for two strains is described by eight equations as https://doi.org/10.1371/journal.pone.0260683.g005 follows.

<figure id="fig-5">
<img src="figures/fig-5.webp" width="832" height="359" alt="Schematic view of transition between disease stages in the case where |M| = 2" loading="lazy" decoding="async">
<figcaption><strong>Fig 5. Schematic view of transition between disease stages in the case where |<em>M</em>| = 2.</strong></figcaption>
</figure>

<div class="equation" id="eq-9"><img src="figures/eq-9.webp" width="456" height="363" alt="dR∅I1(t) dt = β∅;1(R∅I1(t) + R{2}I1(t))R∅(t) − γ∅;1R∅I1(t); dR{2}I1(t) dt = β{2};1(R{2}I1(t) + R∅I1(t))R{2}(t) − γ{2};1R{2}I1(t); dR∅I2(t) dt = β∅;2(R∅I2(t) + R{1}I2(t))R∅(t) − γ∅;2R∅I2(t); dR{1}I2(t) dt = β{1};2(R{1}I2(t) + R∅I2(t))R{1}(t) − γ{1};2R{1}I2(t); dR∅(t) dt = − R∅(t)(β∅;1(R∅I1(t) + R{2}I" loading="lazy" decoding="async"></div>

The initial conditions of Eq (9) are defined for the beginning of a pandemic as follows:

<div class="equation" id="eq-10"><img src="figures/eq-10.webp" width="450" height="56" alt="R(0) = N − 2; RI1(0) = 1; RI2(0) = 1; D(0) = R{1}(0) = R{2}(0) = R{1;2}(0) = R{1}I2(0) = R{2}I1(0) = 0 (10)" loading="lazy" decoding="async"></div>

Moreover,

<div class="equation" id="eq-11"><img src="figures/eq-11.webp" width="455" height="25" alt="N = R + RI1 + RI2 + R{1}I2 + R{2}I1 + R{1} + R{2} + R{1;2} + D: (11)" loading="lazy" decoding="async"></div>

We use a model that does not allow temporary cross-immunity and without increased susceptibility to the second infection.

For |*M*| = 2, we are interested in the equilibrium states of the model, especially stable states in which a pandemic can persist for a long time. In addition, we investigate the basic reproduction number (*R*<sub>0</sub>), as it is an indicator of a pandemic outbreak (*R*<sub>0</sub> *>* 1), and is considered the main characteristic of a pandemic.

### 3.1 Equilibria

The equilibrium state of the model is the state in which the gradient is equal to zero [56]. Hence, Eq (12) takes the form:

<div class="equation" id="eq-12"><img src="figures/eq-12.webp" width="408" height="233" alt="− R∅(β∅;1(R∅I1 + R{2}I1) + β∅;2(R∅I2 + R{1}I2)) = 0; β∅;1(R∅I1 + R{2}I1)R∅ − γ∅;1R∅I1 = 0; β∅;2(R∅I2 + R{1}I2)R∅ − γ∅;2R∅I2 = 0; γ∅;1∅;1R∅I1 − β{1};2(R{1}I2 + R∅I2)R{1} = 0; γ∅;2∅;2R∅I2 − β{2};1(R{2}I1 + R∅I1)R{2} = 0; β{1};2(R{1}I2 + R∅I2)R{1} − γ{1};2R{1}I2 = 0; β{2};1(R{2}I1 + R∅I1)R{2} − γ{2};1R" loading="lazy" decoding="async"></div>

From Eq (12), the *pandemic-free* equilibria is obtained where

<div class="equation" id="eq-13"><img src="figures/eq-13.webp" width="200" height="26" alt="RI∗ 1 = RI∗ 2 = R{1}I∗ 2 = R{2}I∗ 1 = 0;" loading="lazy" decoding="async"></div>

since there are no more infected individuals in this state, which means all strains have gone extinct. Therefore, the equilibria states take the form:

<div class="equation" id="eq-14"><img src="figures/eq-14.webp" width="436" height="30" alt="R∗ = μ1; R∗ {1} = μ2; R∗ {2} = μ3; R∗ 1;2 = μ4; D∗ = N − ∑4 i=1μi: (13)" loading="lazy" decoding="async"></div>

According to [56], this set of states (Eq (13)) is the only asymptotically stable equilibria of the model. Nonetheless, the equilibria states where strain *i* = 1 is over are obtained where

<div class="equation" id="eq-15"><img src="figures/eq-15.webp" width="108" height="26" alt="RI∗ 1 = R{2}I∗ 1 = 0:" loading="lazy" decoding="async"></div>

These equilibria states are epidemiologically interesting as the extinction of one of two strains can be a turning point in multiple pandemic management policies. Thus, it is assumed (without loss of generality) that *i* = 1. Hence, from the fourth and sixth equations, one obtains that

<div class="equation" id="eq-16"><img src="figures/eq-16.webp" width="103" height="26" alt="RI∗ 2 = R{1}I∗ 2 = 0:" loading="lazy" decoding="async"></div>

Accordingly, the system converges to the *pandemic-free* equilibria.

In addition, while other equilibria states theoretically exist (by relaxing the previous assumptions), from an epidemiological point of view, the unstable equilibria are obtained in the middle of the pandemic. It is possible to see that it is enough that an individual may recover in order to diverge from each one of these equilibria states. As such, these equilibria obtained, if any, do not provide a meaningful point in the pandemic’s dynamics.

### 3.2 Basic reproduction number

The basic reproduction number, *R*<sub>0</sub>, is defined as the expected number of secondary cases produced by a single (typical) infection in a completely susceptible population [57]. In the case of a *SIR*-based model, the basic reproduction number indicates an epidemic outbreak if *R*<sub>0</sub> *>* 1 or not if *R*<sub>0</sub> *<* 1.

To find the basic reproduction number for two strains, we use the Next Generation Matrix (NGM) approach [58]. First, we compute the new infections matrix

<div class="equation" id="eq-17"><img src="figures/eq-17.webp" width="416" height="114" alt="F = β;1R 0 β{2};1R 0 0 β;2R 0 β{1};2R β{2};1R{2} 0 β{2};1R{2} 0 0 β{1};2R{1} 0 β{1};2R{1} ⎜ ⎜ ⎜ ⎜ ⎜ ⎜ ⎜ ⎝ ⎟ ⎟ ⎟ ⎟ ⎟ ⎟ ⎟ ⎠ : (14)" loading="lazy" decoding="async"></div>

Afterward, we compute the transfers of infections from one compartment to another matrix

<div class="equation" id="eq-18"><img src="figures/eq-18.webp" width="501" height="115" alt="V = γ;1 0 0 0 0 γ;2 0 0 0 0 γ{1};2 0 0 0 0 γ{2};1 ⎜ ⎜ ⎜ ⎜ ⎜ ⎜ ⎜ ⎝ ⎟ ⎟ ⎟ ⎟ ⎟ ⎟ ⎟ ⎠ → V− 1 = 1=γ;1 0 0 0 0 1=γ;2 0 0 0 0 1=γ{1};2 0 0 0 0 1=γ{2};1 ⎜ ⎜ ⎜ ⎜ ⎜ ⎜ ⎜ ⎝ ⎟ ⎟ ⎟ ⎟ ⎟ ⎟ ⎟ ⎠ : (15)" loading="lazy" decoding="async"></div>

Now, *R*<sub>0</sub> is the dominant eigenvalue of the matrix [58].

<div class="equation" id="eq-19"><img src="figures/eq-19.webp" width="437" height="193" alt="G = FV− 1 = β;1R γ;1 0 β{2};1R γ{1};2 0 0 β;2R γ;2 0 β{1};2R γ{2};1 β{2};1R{2} γ;1 0 β{2};1R{2} γ{1};2 0 0 β{1};2R{1} γ;2 0 β{1};2R{1} γ{2};1 ⎜ ⎜ ⎜ ⎜ ⎜ ⎜ ⎜ ⎜ ⎜ ⎜ ⎜ ⎜ ⎜ ⎜ ⎜ ⎜ ⎜ ⎝ ⎟ ⎟ ⎟ ⎟ ⎟ ⎟ ⎟ ⎟ ⎟ ⎟ ⎟ ⎟ ⎟ ⎟ ⎟ ⎟ ⎟ ⎠ (16)" loading="lazy" decoding="async"></div>

which is obtained from the root of the representative polynomial:

<div class="equation" id="eq-20"><img src="figures/eq-20.webp" width="497" height="268" alt="0 = λ4 − λ3 β{2};1 γ{1};2 + β{1};2 γ{2};1 + β;1 γ;1 + λ2 2 β;2 γ;2 β{2};1 γ{1};2 − β;2 γ;2 + β{1};2 γ{2};1 β;2 γ;2 − β{1};2 γ{2};1 β{1};2 γ;2 + β{2};1 γ{1};2 β;1 γ;1 + β{1};2 γ{2};1 β;1 γ;1 − β{2};1 γ{1};2 ) + λ − β;2 γ;2 2 β{2};1 γ{1};2 + β{1};2 γ{2};1 β{1};2 γ;2 β{2};1 γ{1};2 − 2 β;1 γ;1 β;2 γ;2 β" loading="lazy" decoding="async"></div>

Using *Matlab*’s (version 2021b) symbolic programming, one is able to obtain the *R*<sub>0</sub>. Just find the roots of the polynomial shown in Eq (17) and take the biggest one. This approach cannot be generalized for more than two strains |*M*| *>* 2 as the NGM will be of size *k* × *k* where *k* = ∑<sup>|M|</sup> <sub>i=1</sub>*nx*. Namely, the size of the NGM is larger than four and according to Galois theory [59] and based on the Abel–Ruffini theorem [60], the roots of the representative polynomial of the NGM cannot be obtained using radicals. This means one cannot provide a closed-form formula for the eigenvalues of the NGM which are used to obtain *R*<sub>0</sub>.

### 3.3 Model validation

The model validation is divided into two phases: parameter estimation and historical fitting. The parameter estimation method allows us to use of the proposed model on a specific pandemic and the historical fitting shows the ability of the proposed model to approximate real pandemic spread dynamics given the obtained parameters.

**3.3.1 Parameter estimation.** The proposed epidemiological model parameter for the case |*M*| = 2 is obtained by fitting the proposed model onto the historical data from April 1 (2020) to December 1 (2020) of the UK by WHO [7], using the fourth-order Runge-Kutta [54] and gradient descent [61] algorithms. These dates are picked as the population in the UK during this period had not been vaccinated against the COVID-19 disease yet and a second strain (i.e., the COVID-19 UK Variant—B.1.1.7) appeared according to [62], which based their analysis on clinical testing and later reverse engineering of the mutation’s appearance [63]. Both point to the same period even though there is no full agreement on the specific dates of the appearance of the mutation. Specifically, we randomly guess the values of the model’s parameters, solving the system of ODEs using the fourth-order Runge-Kutta method and computing the Gaussian (*L*<sub>2</sub>) distance from the historical data. In particular, we used the daily number of infection, recovered, and deceased individuals. As such, the fitness function takes the form:

<div class="equation" id="eq-21"><img src="figures/eq-21.webp" width="514" height="45" alt="F(H; P)[t0;tf ]≔ ∑ tf t=t0((H[S](t) − P[S](t)) 2 + (H[R](t) − P[R](t)) 2 + (H[I](t) − P[I](t)) 2) √ ; (18)" loading="lazy" decoding="async"></div>

where *H*\[*X*\](*t*) is the historical size of the population at the epidemiological state *X* at time *t* and *P*\[*X*\](*t*) is the model’s prediction size of the population at the epidemiological state *X* at time *t*. The model’s *P*[*I*] and *P*[*R*] refer to all states for the form *R*<sub>j</sub>*I*<sub>i</sub> and *R*<sub>j</sub>, respectively.

<figure id="fig-6">
<img src="figures/fig-6.webp" width="486" height="142" alt="A schematic view of the fitting method" loading="lazy" decoding="async">
<figcaption><strong>Fig 6. A schematic view of the fitting method.</strong></figcaption>
</figure>

https://doi.org/10.1371/journal.pone.0260683.g006

Afterward, we repeated this process while modifying the value of a single parameter by some pre-defined value *δ* = 0.01, obtaining a numerical gradient. At this stage, we used the gradient descent algorithm in order to find the values that minimize the model’s *L*<sub>2</sub> distance from the historical data using Eq (18). The process is stopped once the gradient’s (*L*<sub>1</sub>) norm is smaller than some pre-defined threshold value = 0.1. The entire process is repeated *r* = 100 times and the parameter values that are obtained most often are decided to be the model’s parameter value. The values for (*δ*, , *r*) are manually picked. A schematic view of the fitting method is presented in Fig 6.

**3.3.2 Historical fitting.** In order to numerically evaluate the ability of the proposed model to fit real epidemiological data, we decided to simulate the COVID-19 pandemic in the United Kingdom (UK). This case is chosen due to the availability of epidemiological data and since a COVID-19 strain is known to originate in the UK [7, 64]. Therefore, we computed the parameter values, assuming the initial conditions taking the form:

<div class="equation" id="eq-22"><img src="figures/eq-22.webp" width="336" height="23" alt="R(0) = 67200000; RI1(0) = 100; RI2(0) = 1; D(0) = 0" loading="lazy" decoding="async"></div>

<div class="equation" id="eq-23"><img src="figures/eq-23.webp" width="30" height="23" alt="(19)" loading="lazy" decoding="async"></div>

<div class="equation" id="eq-24"><img src="figures/eq-24.webp" width="325" height="26" alt="R{1}(0) = R{2}(0) = R{1;2}(0) = R{1}I2(0) = R{2}I1(0) = 0:" loading="lazy" decoding="async"></div>

where *R*<sub>∅</sub>(0) = 67200000 to represent the size of the UK population in the beginning of the pandemic. A summary of the obtained parameter values is shown in Table 1, such that 27% of the random parameter value initial conditions converged to the values with *d*<sub>L2</sub> = 0*:*089. Namely, the model has a daily mean square error of 8.9%.

One needs to be cautious with this historical fitting of COVID-19 data due to historical error in COVID-19 related death classification, undersampling of infected individuals, and errors associated in identifying the strain individuals are infected with [65, 66]. These errors may result in off representation of the epidemiological dynamics and as such wrong parameter values. Nonetheless, COVID-19 is the most documented pandemic in history [67] and therefore it is the best candidate to use despite the problems associated with it.

A fitting dynamics between the historical data (circle, black) and the model’s prediction (axes, blue) is shown in Fig 7, where the x-axis describes the time from September 1 (2020) to December 1 (2020), and the y-axis describes the daily basic reproduction number (*R*<sub>0</sub>). The historical basic reproduction number (*R*<sub>0</sub>) from WHO is computed using the following formula *R*<sub>0</sub>(*t*)≔ <sup>I(t+1)− I(t)</sup> <sub>R(t+1)− R(t)</sub> *:*.

## 4 Discussion

We have developed a mathematical model and a computer simulation aiming at establishing the connections between the number of pandemic disease strains and the pandemic’s spread in the population for any pathogen, under the epidemiological *SIRD* model. Unlike the previous modeling approaches [12, 38, 40], we have extended the strain diversity for any arbitrary number (*m*) and did not introduce any pathogen-specific attributes, keeping the model as generic as possible.

<figure class="table-figure" id="table-1">
<figcaption><strong>Table 1. A summary of the model parameters and values for the case of |<em>M</em>| = 2, obtained from the fitting process to the historical WHO COVID-19 data from April 1 (2020) to December 1 (2020).</strong></figcaption>
<div class="table-scroll"><table><tr><th>Parameter Definition</th><th>Symbol</th><th>Value</th></tr><tr><td>Infection rate of the strain (i = 1) [1]</td><td>β;,1</td><td>0.04</td></tr><tr><td>Infection rate of the strain (i = 2) [1]</td><td>β;,2</td><td>0.07</td></tr><tr><td>Infection rate of the strain (i = 2), after recovery from the strain (i = 1) [1]</td><td>β{1},2</td><td>0.01</td></tr><tr><td>Infection rate of the strain (i = 1), after recovery from the strain (i = 2) [1]</td><td>β{2},1</td><td>0.02</td></tr><tr><td>The average duration that it takes for an individual to recover from the strain (i = 1) in days [t−1]</td><td>γ;,1</td><td>0.08</td></tr><tr><td>The average duration that it takes for an individual to recover from the strain (i = 2) in days [t−1]</td><td>γ;,2</td><td>0.06</td></tr><tr><td>The average duration that it takes for an individual to recover from the strain (i = 1) after<br/>recovering from the strain (i = 2) in days [t−1]</td><td>γ{2},1</td><td>0.21</td></tr><tr><td>The average duration that it takes for an individual to recover from the strain (i = 2) after<br/>recovering from the strain (i = 1) in days [t−1]</td><td>γ{1},2</td><td>0.17</td></tr><tr><td>The probability an infected individual will recover from the strain (i = 1) [1]</td><td>ϕ;,1</td><td>0.98</td></tr><tr><td>The probability an infected individual will recover from the strain (i = 2) [1]</td><td>ϕ;,2</td><td>0.96</td></tr><tr><td>The probability an infected individual will recover from the strain (i = 2) after recovering from the<br/>strain (i = 2) [1]</td><td>ϕ{1},2</td><td>0.99</td></tr><tr><td>The probability an infected individual will recover from the strain (i = 3) after recovering from the<br/>strain (i = 1) [1]</td><td>ϕ{2},1</td><td>0.99</td></tr></table></div>
<p class="table-note"></p>
</figure>

We have shown that for the case of only two strains (e.g., |*M*| = 2), the only stable equilibria states are when the pandemic is over for both strains (*R*<sub>∅</sub>*I*<sup>∗</sup> <sub>1</sub> = *R*<sub>∅</sub>*I*<sup>∗</sup> <sub>2</sub> = *R*<sub>{1}</sub>*I*<sup>∗</sup> <sub>2</sub> = *R*<sub>{2}</sub>*I*<sup>∗</sup> <sub>1</sub> = 0), as shown in Section 3.3.2. The result of the equilibrium analysis is that the *pandemic-free* states https://doi.org/10.1371/journal.pone.0260683.g007 are stable only when the epidemics of the two strains cease; that is, after the end of the general pandemic (Eq (13)).

<figure id="fig-7">
<img src="figures/fig-7.webp" width="486" height="361" alt="Daily R0 in UK between September 1 and December 1 (2020) comparison between the historical data (specifically, the daily number of infected, recovered, and dead individuals) and the proposed model pre" loading="lazy" decoding="async">
<figcaption><strong>Fig 7. Daily <em>R</strong></em><sub>0</sub> <strong>in UK between September 1 and December 1 (2020) comparison between the historical data (specifically, the daily number of infected, recovered, and dead individuals) and the proposed model predictions (for |<em>M</em>| = 2).</strong> The gray horizontal line indicates <em>R</em><sub>0</sub> = 1. The model’s parameter values are shown in Table 1.</figcaption>
</figure>

Moreover, an analytical computation of the basic reproduction number (*R*<sub>0</sub>) requires information on infections between individuals with different strains, which is not realistically available. Therefore, an immediate result of the model is that once a pandemic developed secondary strains, a numerical and statistical approximation of *R*<sub>0</sub> is left to be the only feasible approach.

In addition, the proposed model is evaluated on the COVID-19 pandemic (for the case of the UK) and has shown promising ability to fit a long period of multi-strain historical data (eight months, 8.9% daily mean square error). A prediction of the last two months of this period is shown in Fig 7, based on the obtained model’s parameter values which are presented in Table 1. Strain *i* = 1 is mapped to the original strain of COVID-19. Since at the beginning of the pandemic, this was only a single strain, the measured epidemiological values are necessarily associated with this strain. This is not the case for measurements of periods where two or more strains existed. The proposed model captures a general trend of decreasing *R*<sub>0</sub> during this period while not matching the data closely as it intentionally does not take into consideration other social and epidemiological dynamics, allowing analytical analysis to be considered. However, future extensions of the proposed model should be able to predict more closely historical pandemic events.

According to Voinsky et al. [68], the average recovery rate of strain (*i* = 1) is 0.0714 while the model predicted *γ*<sub>∅,1</sub> = 0.08 (where the approximation size is *δ* = 0.01), as presented in Table 1. In addition, according to WHO [7], the average mortality rate of this period is ∼ 0.0138 while the model predicted that the average mortality rate from this strain is 1 −*ϕ*<sub>∅,1</sub> = 0.02. Thus, while the model is simple, it is able to capture the biological and epidemiological properties of the pandemic.

Furthermore, we evaluated the influence of the number of strains on the mean basic reproduction number (*E*[*R*<sub>0</sub>]), mortality rate, and a maximum number of infected individuals, as shown in Figs 2, 4 and 3, respectively. We show that the basic reproduction number is upper bounded by taking into consideration only the most aggressive strain. Formally, we computed a one-sided confidence interval between the baseline and the most aggressive strain dynamics and found that 0 is not included in the confidence interval (*α* = 0.05). Hence, we conclude that the two dynamics are different and that the most aggressive strain dynamic is an upper bound of the baseline dynamics. This result agrees with the one obtained by [40] for arbitrary number of mutations and [42] for the case of |*M*| = 2. In particular, [42] has shown that analytically the most aggressive strain and the baseline dynamic converge which is shown in Fig 2. The slight difference in the mean value is associated with the stochastic nature of the numerical computation method. An immediate outcome is that the proposed model is upper bounded by the *SIRD* model with the slight modification that each individual can be infected up to |*M*| times. This means one can get a statistically similar result (on average) to a pandemic with |*M*| strains by using a simpler model that requires less biological and epidemiological data compared to the proposed model. These results agree with the analysis performed by Dang et al. [36] on a multi-strain model for influenza.

Based on Eq (7), the maximum number of infected individuals is growing in a logarithmic manner to the number of strains when the latter occurs simultaneously. In a similar manner, based on Eq (8), the mortality rate is growing in a logarithmic manner to the number of strains when the latter occur simultaneously. We numerically show in Figs 3 and 4 that the epidemiological properties which indicate the severity of the pandemic in a well-mixed population grow in a logarithmic manner as a function of the number of strains (|*M*|). This connection indicates that the first few strains make a relatively large contribution to the mortality and pandemic spread dynamics, but as the number of strains grows, each strain contributes less to these numbers. Policymakers can take advantage of this link when planning intervention policies to contain the spread of a pandemic, given that new strains can emerge during pathogen mutation. The code developed for this model is publicly available as open-source.

Several possible future research directions emerge from the proposed initial modeling. First, one can introduce a fixed delay parameter to the occurrence of strains, investigating the influence of this parameter on the epidemiological spread similar to the model proposed by Arruda et al. [40]. Second, one can take into consideration more detailed biological settings, assuming the stochastic occurrence of the strains from some distribution. Third, one can allow reinfection of the same strain, extending the proposed model to a *SIRS*-based model. These directions aim to better represent a real pandemic where several strains do not exist from the beginning of the pandemic. Moreover, one can introduce a similarity matrix between the strains as they are mutations of an original strain, which are reflected by the immunity response to reinfection of different strains or a cross-immunity response as proposed by [69]. In the same direction, adding an Exposed state would make the proposed model more biologically accurate, since most strains have an incubation period before the host becomes infectious. The multi-strain model is a theoretical platform that will help guide the decision-making process in the event of a pandemic crisis while providing the forecast of the results of the selected course of action.

## Supporting information

**S1 Appendix. Single and two mutations model.** (PDF)

## Author Contributions

**Formal analysis:** Teddy Lazebnik.

**Investigation:** Teddy Lazebnik.

**Methodology:** Teddy Lazebnik.

**Project administration:** Teddy Lazebnik, Svetlana Bunimovich-Mendrazitsky.

**Software:** Teddy Lazebnik.

**Supervision:** Svetlana Bunimovich-Mendrazitsky.

**Validation:** Teddy Lazebnik, Svetlana Bunimovich-Mendrazitsky.

**Visualization:** Teddy Lazebnik.

**Writing – original draft:** Teddy Lazebnik.

**Writing – review & editing:** Svetlana Bunimovich-Mendrazitsky.

## References

1. Janku A, Schenk G, Mauelshagen F. Historical Disasters in Context: Science, Religion, and Politics. Routledge; 2011.
2. Gottshang TR. Economic Change, Disasters, and Migration: The Historical Case of Manchuria. Economic Development and Cultural Change. 1987; 45(3).
3. Noji EK, Toole MJ. The Historical Development of Public Health Responses to Disasters. Disasters. 1997; 21:366–376. [doi:10.1111/1467-7717.00068](https://doi.org/10.1111/1467-7717.00068) · [PubMed 9455008](https://pubmed.ncbi.nlm.nih.gov/9455008/)
4. van Bavel BJP, Curtis DR. Better Understanding Disasters by Better Using History. International Journal of Mass Emergencies and Disasters. 2016; 34(1):143–169.
5. Conti AA. Historical and methodological highlights of quarantine measures: from ancient plague epidemics to current coronavirus disease (COVID-19) pandemic. Acta bio-medica: Atenei Parmensis. 2020; 91(2):226–229. [doi:10.23750/abm.v91i2.9494](https://doi.org/10.23750/abm.v91i2.9494) · [PubMed 32420953](https://pubmed.ncbi.nlm.nih.gov/32420953/)
6. Brodeur A, Gray D, Islam A, Bhuiyan S. A Literature Review of the Economics of COVID-19. IZA Discussion Paper No 13411, Available at SSRN: https://ssrncom/abstract=3636640. 2020. [link](https://ssrncom/abstract=3636640)
7. WHO. WHO Coronavirus Disease (COVID-19) Dashboard;. Available from: https://covid19.who.int/. [link](https://covid19.who.int/)
8. Lazebnik T, Bunimovich-Mendrazitsky S, Shami L. Pandemic management by a spatio–temporal mathematical model. International Journal of Nonlinear Sciences and Numerical Simulation. 2021.
9. Lederberg J. Medical Science, Infectious Disease, and the Unity of Humankind. JAMA. 1988; 260 (5):684–685. [PubMed 3392795](https://pubmed.ncbi.nlm.nih.gov/3392795/)
10. Wu T, Perrings C, Kinzig A, Collins JP, Minteer BA, Daszak P. Economic growth, urbanization, globalization, and the risks of emerging infectious diseases in China: A review. Ambio. 2017; 46(1):18–29. [doi:10.1007/s13280-016-0809-2](https://doi.org/10.1007/s13280-016-0809-2) · [PubMed 27492678](https://pubmed.ncbi.nlm.nih.gov/27492678/)
11. Cheng XX, Wang Y, Huang G. Dynamics of a competing two-strain SIS epidemic model with general infection force on complex networks. Nonlinear Analysis-Real World Applications. 2021; 59:103247. [doi:10.1016/j.nonrwa.2020.103247](https://doi.org/10.1016/j.nonrwa.2020.103247)
12. Gordo I, Gomes MGM, Reis DG, Campos PRA. Genetic Diversity in the SIR Model of Pathogen Evolution. Plos One. 2009; 4(3):e4876. [doi:10.1371/journal.pone.0004876](https://doi.org/10.1371/journal.pone.0004876) · [PubMed 19287490](https://pubmed.ncbi.nlm.nih.gov/19287490/)
13. Shi P, Keskinocak P, Swann J, Lee BY. Modelling seasonality and viral mutation to predict the course of an influenza pandemic. Epidemiology and Infection. 2010; 138(10):1472–1481. [doi:10.1017/S0950268810000300](https://doi.org/10.1017/S0950268810000300) · [PubMed 20158932](https://pubmed.ncbi.nlm.nih.gov/20158932/)
14. Kermack WO, McKendrick AG. A contribution to the mathematical theory of epidemics. Proceedings of the Royal Society. 1927; 115:700–721.
15. Libi F, Weiguo S, Wei L, Siuming L. Simulation of emotional contagion using modified SIR model: A cellular automaton approach. Physica A: Statistical Mechanics and its Applications. 2014; 405(1):380– 391.
16. Lazebnik T, Shami L, Bunimovich-Mendrazitsky S. Spatio-Temporal Influence of Non-Pharmaceutical Interventions Policies on Pandemic Dynamics and the Economy: The Case of COVID-19. Epidemio-logic-Economic. 2021.
17. Bognanni M, Hanley D, Kolliner D, Mitman K. Economics and Epidemics: Evidence from an Estimated Spatial Econ-SIR Model PDF Logo. Institute of Labor Economics. 2020.
18. Milner FA, Zhao R. S-I-R Model with Directed Spatial Diffusion. An International Journal of Mathematical Demography. 2008; 15(3).
19. Oka T, Wei W, Zhu D. A Spatial Stochastic SIR Model for Transmission Networks with Application to COVID-19 Epidemic in China. SSRN. 2020.
20. Lazebnik T, Alexi A. Comparison of Pandemic Intervention Policies in Several Building Types Using Heterogeneous Population Model. Communications in Nonlinear Science and Numerical Simulation. 2021.
21. Towers S, Vogt Geisse K, Zheng Y, Feng Z. Antiviral treatment for pandemic influenza: Assessing potential repercussions using a seasonally forced SIR model. Journal of Theoretical Biology. 2011; 289:259–268. [doi:10.1016/j.jtbi.2011.08.011](https://doi.org/10.1016/j.jtbi.2011.08.011) · [PubMed 21867715](https://pubmed.ncbi.nlm.nih.gov/21867715/)
22. Kamp C, Heiden M, Henseler O, Seitz R. Management of blood supplies during an influenza pandemic. Transfusion. 2010; 50:231–239. [doi:10.1111/j.1537-2995.2009.02498.x](https://doi.org/10.1111/j.1537-2995.2009.02498.x) · [PubMed 20002894](https://pubmed.ncbi.nlm.nih.gov/20002894/)
23. Weiss H. The SIR model and the Foundations of Public Health. Materials Matemàtics. 2013; p. 1–17.
24. Cooper I, Mondal A, Antonopoulos CG. A SIR model assumption for the spread of COVID-19 in different communities. Chaos, Solitons, and Fractals. 2020; 139:110057. [doi:10.1016/j.chaos.2020.110057](https://doi.org/10.1016/j.chaos.2020.110057) · [PubMed 32834610](https://pubmed.ncbi.nlm.nih.gov/32834610/)
25. Agarwal M, Bhadauria AS. Modeling Spread of Polio with the Role of Vaccination. Applications and Applied Mathematics. 2011; 6:552–571.
26. Bunimovich-Mendrazitsky S, Stone L. Modeling polio as a disease of development. Journal of Theoretical Biology. 2005; 237:302–315. [doi:10.1016/j.jtbi.2005.04.017](https://doi.org/10.1016/j.jtbi.2005.04.017) · [PubMed 15975604](https://pubmed.ncbi.nlm.nih.gov/15975604/)
27. Wells VR, Plotch SJ, DeStefano JJ. Determination of the mutation rate of poliovirus RNA-dependent RNA polymerase. Virus Research. 2001; 74(1):119–132. [doi:10.1016/S0168-1702(00)00256-2](https://doi.org/10.1016/S0168-1702%2800%2900256-2) · [PubMed 11226580](https://pubmed.ncbi.nlm.nih.gov/11226580/)
28. Reluga TC. An SIS epidemiology game with two subpopulations. Journal of Biological Dynamics. 2008; p. 515–531.
29. Yicang Z, Hanwu L. Stability of periodic solutions for an SIS model with pulse vaccination. Mathematical and Computer Modelling. 2003; 38(3):299–308.
30. Yanli Z, Sanling Y, Dianli Z. Threshold behavior of a stochastic SIS model with Levy jumps. Applied Mathematics and Computation. 2016; 275:255–267.
31. Rappuoli R, Dormitzer PR. Influenza: Options to Improve Pandemic Preparation. Science. 2012; 336 (6088):1531–1533. [doi:10.1126/science.1221466](https://doi.org/10.1126/science.1221466) · [PubMed 22723412](https://pubmed.ncbi.nlm.nih.gov/22723412/)
32. Tkachenko AV, Maskov S, Elbanna A, Wong GN, Weiner ZJ, Goldenfeld N. Time-dependent heterogeneity leads to transient suppression of the COVID-19 epidemic, not herd immunity. Science. 2021; 118 (17):e2015972118.
33. Moein S, Nickaeen N, Roointan A, Bohani N, Heidary Z, Javanmard SH, et al. Inefficiency of SIR models in forecasting COVID-19 epidemic: a case study of Isfahan. Scientific Reports. 2021; 11:4725. [doi:10.1038/s41598-021-84055-6](https://doi.org/10.1038/s41598-021-84055-6) · [PubMed 33633275](https://pubmed.ncbi.nlm.nih.gov/33633275/)
34. Chowell G, Sattenspiel L, Bansal S, Viboud C. Mathematical models to characterize early epidemic growth: A review. Physics of Life Reviews. 2016; 18:66–97. [doi:10.1016/j.plrev.2016.07.005](https://doi.org/10.1016/j.plrev.2016.07.005) · [PubMed 27451336](https://pubmed.ncbi.nlm.nih.gov/27451336/)
35. Minayev P, Ferguson N. Improving the realism of deterministic multi-strain models: implications for modelling influenza A. Journal of the Royal Society Interface. 2008;. [doi:10.1098/rsif.2008.0333](https://doi.org/10.1098/rsif.2008.0333) · [PubMed 18801714](https://pubmed.ncbi.nlm.nih.gov/18801714/)
36. Dang YX, Li XZ, Martcheva M. Competitive exclusion in a multi-strain immuno-epidemiological influenza model with environmental transmission. Journal of Biological Dynamics. 2016; 10(1). [doi:10.1080/17513758.2016.1217355](https://doi.org/10.1080/17513758.2016.1217355) · [PubMed 27608293](https://pubmed.ncbi.nlm.nih.gov/27608293/)
37. Marquioni VM, de Aguiar MAM. Modeling neutral viral mutations in the spread of SARS-CoV-2 epidemics. Plos One. 2021; 16(7):e0255438. [doi:10.1371/journal.pone.0255438](https://doi.org/10.1371/journal.pone.0255438) · [PubMed 34324605](https://pubmed.ncbi.nlm.nih.gov/34324605/)
38. Khyar O, Allali K. Global dynamics of a multi-strain SEIR epidemic model with general incidence rates: application to COVID-19 pandemic. Nonlinear Dynamics. 2020; 102:489–509. [doi:10.1007/s11071-020-05929-4](https://doi.org/10.1007/s11071-020-05929-4) · [PubMed 32921921](https://pubmed.ncbi.nlm.nih.gov/32921921/)
39. Gubar E, Taynitskiy V, Zhu Q. Optimal Control of Heterogeneous Mutating Viruses. Games. 2018; 9 (4):103. [doi:10.3390/g9040103](https://doi.org/10.3390/g9040103)
40. Arruda EF, Das SS, Dias CM, Pastore DH. Modelling and optimal control of multi strain epidemics, with application to COVID-19. PLOS ONE. 2021; 16(9):1–18. [doi:10.1371/journal.pone.0257512](https://doi.org/10.1371/journal.pone.0257512) · [PubMed 34529745](https://pubmed.ncbi.nlm.nih.gov/34529745/)
41. Viguerie A, Lorenzo G, Auricchio F, Baroil D, Hughes TJR, Patton A, et al. Simulating the spread of COVID-19 via a spatially-resolved susceptible-exposed-infected-recovered-deceased (SEIRD) model with heterogeneous diffusion. Appl Math Lett. 2021; 111:106617. [doi:10.1016/j.aml.2020.106617](https://doi.org/10.1016/j.aml.2020.106617) · [PubMed 32834475](https://pubmed.ncbi.nlm.nih.gov/32834475/)
42. Fudolig M, Howard R. The local stability of a modified multi-strain SIR model for emerging viral strains. PLOS ONE. 2020; 15(12):e0243408. [doi:10.1371/journal.pone.0243408](https://doi.org/10.1371/journal.pone.0243408) · [PubMed 33296417](https://pubmed.ncbi.nlm.nih.gov/33296417/)
43. Aleta A, Hisi ANH, Meloni S, Poletto C, Colizza V, Moreno Y. Human mobility networks and persistence of rapidly mutating pathogens. Royal Society Open Science. 2017; 4:160914. [doi:10.1098/rsos.160914](https://doi.org/10.1098/rsos.160914) · [PubMed 28405379](https://pubmed.ncbi.nlm.nih.gov/28405379/)
44. Di Giamberardino P, Iacoviello D, Papa F, Sinisgalli C. A data-driven model of the COVID-19 spread among interconnected populations: epidemiological and mobility aspects following the lockdown in Italy. Nonlinear Dynamics. 2021; 106:1239–1266. [doi:10.1007/s11071-021-06840-2](https://doi.org/10.1007/s11071-021-06840-2) · [PubMed 34493902](https://pubmed.ncbi.nlm.nih.gov/34493902/)
45. Cox RJ, Brokstad KA. Not just antibodies: B cells and T cells mediate immunity to COVID-19. Nature Reviews Immunology. 2020; 20:581–582. [doi:10.1038/s41577-020-00436-4](https://doi.org/10.1038/s41577-020-00436-4) · [PubMed 32839569](https://pubmed.ncbi.nlm.nih.gov/32839569/)
46. Winer DA, Winder S, Shen L, Wadia PP, Yantha J, Paltser G, et al. B-cells promote insulin resistance through modulation of T cells and production of pathogenic IgG antibodies. Nature Medicine. 2011; 17:610–617. [doi:10.1038/nm.2353](https://doi.org/10.1038/nm.2353) · [PubMed 21499269](https://pubmed.ncbi.nlm.nih.gov/21499269/)
47. Mukherjee S, Tworowski D, Detroja R, Mukherjee SB, Frenkel-Morgenstern M. Immunoinformatics and structural analysis for identification of immunodominant epitopes in SARS-CoV-2 as potential vaccine targets. Vaccines. 2020;. [doi:10.3390/vaccines8020290](https://doi.org/10.3390/vaccines8020290) · [PubMed 32526960](https://pubmed.ncbi.nlm.nih.gov/32526960/)
48. Yaqinuddin A. Cross-immunity between respiratory coronaviruses may limit COVID-19 fatalities. Medical hypotheses. 2020;. [doi:10.1016/j.mehy.2020.110049](https://doi.org/10.1016/j.mehy.2020.110049) · [PubMed 32758887](https://pubmed.ncbi.nlm.nih.gov/32758887/)
49. Roche B, Drake JM, Rohani P. An Agent-Based Model to study the epidemiological and evolutionary dynamics of Influenza viruses. BMC Buiunftinatics. 2011; 12:87.
50. Breda D, Florian F, Ripoll J, Vermiglio R. Efficient numerical computation of the basic reproduction number for structured populations. Journal of Computational and Applied Mathematics. 2021; 384:113165. [doi:10.1016/j.cam.2020.113165](https://doi.org/10.1016/j.cam.2020.113165) · [PubMed 32868963](https://pubmed.ncbi.nlm.nih.gov/32868963/)
51. Chatterjee K, Chatterjee K, Kumar A, Shankar S. Healthcare impact of COVID-19 epidemic in India: A stochastic mathematical model. Medical Journal Armed Forces India. 2020; 76(2):147–155. [doi:10.1016/j.mjafi.2020.03.022](https://doi.org/10.1016/j.mjafi.2020.03.022) · [PubMed 32292232](https://pubmed.ncbi.nlm.nih.gov/32292232/)
52. Baud D, Qi X, Nielsen-Saines K, Musso D, Pomar L, Favre G. Real estimates of mortality following COVID-19 infection. The Lancet Infectious Diseases. 2020; 20(7):773. [doi:10.1016/S1473-3099(20)30195-X](https://doi.org/10.1016/S1473-3099%2820%2930195-X) · [PubMed 32171390](https://pubmed.ncbi.nlm.nih.gov/32171390/)
53. Lazebnik T, Bunimovich-Mendrazitsky S. The Signature Features of COVID-19 Pandemic in a Hybrid Mathematical Model—Implications for Optimal Work–School Lockdown Policy. Advanced Theory and Simulations. 2021; p. 2000298. [doi:10.1002/adts.202000298](https://doi.org/10.1002/adts.202000298) · [PubMed 34230906](https://pubmed.ncbi.nlm.nih.gov/34230906/)
54. Yaakub AR, Evans DJ. A fourth order Runge–Kutta RK(4,4) method with error control. International Journal of Computer Mathematics. 1996; p. 383–411.
55. Bjorck A. Numerical Methods for Least Squares Problems. Society for Industrial and Applied Mathematics. 1996; 5:497–513.
56. Lazebnik T, Bunimovich-Mendrazitsky S, Shaikhet L. Novel Method to Analytically Obtain the Asymptotic Stable Equilibria States of Extended SIR-type Epidemiological Models. Symmetry. 2021;. [doi:10.3390/sym13071120](https://doi.org/10.3390/sym13071120)
57. van den Driessche P, Watmough J. Reproduction numbers and sub-threshold endemic equilibria for compartmental models of disease transmission. Mathematical Biosciences. 2002; 180(1):29–48. [doi:10.1016/S0025-5564(02)00108-6](https://doi.org/10.1016/S0025-5564%2802%2900108-6) · [PubMed 12387915](https://pubmed.ncbi.nlm.nih.gov/12387915/)
58. Diekmann O, Heesterbeek JA, Roberts MG. The construction of next-generation matrices for compartmental epidemic models. Journal of the Royal Society. 2010; 7(47):873–885. [doi:10.1098/rsif.2009.0386](https://doi.org/10.1098/rsif.2009.0386) · [PubMed 19892718](https://pubmed.ncbi.nlm.nih.gov/19892718/)
59. Galois E, Neumann PM. The Mathematical Writings of É variste Galois. European Mathematical Society. 2011.
60. Abel NH. Mémoire sur les équations algébriques, ou l’on démontre l’impossibilité de la résolution de l’équation générale du cinquième degré. Sylow, Ludwig; Lie, Sophus. 1824; p. 28–33.
61. Curry HB. The method of steepest descent for non-linear minimization problems. Quarterly of Applied Mathematics. 1944; 2(3):258–261. [doi:10.1090/qam/10667](https://doi.org/10.1090/qam/10667)
62. Mahase E. Covid-19: What have we learnt about the new variant in the UK? BMJ. 2020;. [doi:10.1136/bmj.m4944](https://doi.org/10.1136/bmj.m4944) · [PubMed 33361120](https://pubmed.ncbi.nlm.nih.gov/33361120/)
63. Sherman SM, Smith LE, Sim J, Amlot R, Cutts M, Dasch H, et al. COVID-19 vaccination intention in the UK: results from the COVID-19 vaccination acceptability study (CoVAccS), a nationally representative cross-sectional survey. Human Vaccines and Immunotherapeutics. 2021; 6:1612–1621. [doi:10.1080/21645515.2020.1846397](https://doi.org/10.1080/21645515.2020.1846397)
64. Wise J. Covid-19: New coronavirus variant is identified in UK. BMJ. 2020; 371. [PubMed 33328153](https://pubmed.ncbi.nlm.nih.gov/33328153/)
65. Dyer O. Covid-19: Peru’s official death toll triples to become world’s highest. BMJ. 2021; 373:1442. [doi:10.1136/bmj.n1442](https://doi.org/10.1136/bmj.n1442) · [PubMed 34088698](https://pubmed.ncbi.nlm.nih.gov/34088698/)
66. Sabino EC, Buss LF, Carvalho MPS, Prete CA, Crispim MAE, Fraiji NA, et al. Resurgence of COVID-19 in Manaus, Brazil, despite high seroprevalence. The Lancet. 2021; 397(10273):452–455. [doi:10.1016/S0140-6736(21)00183-5](https://doi.org/10.1016/S0140-6736%2821%2900183-5) · [PubMed 33515491](https://pubmed.ncbi.nlm.nih.gov/33515491/)
67. Kosciejew M. Remembering COVID-19; or, a duty to document the coronavirus pandemic. IFLA Journal. 2021.
68. Voinsky I, Baristaite G, Gurwitz D. Effects of age and sex on recovery from COVID-19: Analysis of 5769 Israeli patients. The Journal of infection. 2020; 81:102–103. [doi:10.1016/j.jinf.2020.05.026](https://doi.org/10.1016/j.jinf.2020.05.026) · [PubMed 32425274](https://pubmed.ncbi.nlm.nih.gov/32425274/)
69. Lazebnik T, Blumrosen G. Advanced Muti-Mutation with Intervention Policies Pandemic Model. IEEE Access. 2022;. [doi:10.1109/ACCESS.2022.3149956](https://doi.org/10.1109/ACCESS.2022.3149956)
