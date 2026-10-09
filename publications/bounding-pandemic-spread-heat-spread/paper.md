## 1 Introduction

Over the history of mankind, pandemics cause repetitive catastrophic suffering [1]. It causes significant increase in the mortality rate [2], major economic losses [3], and substantial political instability [4]. However, proper management of the pandemic can significantly reduce all of this [5, 6]. Nonetheless, suitable governance during a pandemic time requires an understanding of the pandemic’s dynamics. Unfortunately, this task is very challenging. The main difficulty is the uncertainty in real time. To reduce this, one needs to consider all the relevant factors. Nevertheless, pointing out the suitable features that appear in real time is extremely hard [7]. The process of collecting epidemiological, clinical, and biological data is time-consuming, expensive, and complex at the operational level [8, 9]. In addition, policymakers need to act fast 0123456789().: V,-vol during the beginning of the pandemic to contain it at an early stage [10]. Inability to do so will result in greater disaster later in the pandemic [10].

Thus, providing policy-making with good analytic tools is essential. The fashion to obtain data-driven decisions is epidemiological-mathematical models [11]. These provide an analytical framework to obtain an analysis of the pandemic’s spread dynamics [12–14]. A large group of epidemiological models is based on the Susceptible- Infected-Recovered (SIR) model [7]. This model provides good baseline results [15]. The *SIR* model assumes that the course of an epidemic is short compared with the life of an individual. Therefore, the size of the population may be considered to be constant. This assumption is reasonable as far as it is not modified by deaths due to the epidemic disease itself. Furthermore, the *SIR* model assumes all individuals in the population are initially equally susceptible to the disease (*S*) and only one individual is infected (*I*) at the beginning of the pandemic. Moreover, it is further assumed that complete immunity is conferred by a single infection. In other words, it is possible to represent the *SIR* model using a system of non-linear ordinary differential equations where the average infected rate, *β*, and the average recovery rate, *γ* , are known:

<div class="equation" id="eq-1"><img src="figures/eq-1.webp" width="310" height="98" alt="dS(t) dt = −βS(t)I(t) dI(t) dt = βS(t)I(t) −γ I(t) dR(t) dt = γ I (t). (1)" loading="lazy" decoding="async"></div>

Naively, one would consider the average infected rate *β* and the average recovery rate *γ* to be deterministic quantities that might cause model artifacts. For example, a susceptible individual *(p* ∈ *S)* can be infected and transformed into the infected sub-population *(I)* in a given time *t*. Immediately afterward, in time *t* + 1, there is a probability *γ* that the same individual is recovered and transformed to the recovered sub-population (*R*) [16]. To overcome this, we considered these quantities to be stochastic. This is because the uncertain nature of multiple epidemiological, social, and economic processes produce these coefficients. Hence, it is possible to treat these coefficients as a transformation probability between the states [17].

To gain a more epidemiological detailed model, one can use an interaction graph to represent infection routes. From an epidemiological point of view, an interaction graph gives a more descriptive representation of infections between individuals [18]. Formally, an interaction graph is where individuals are the graph’s nodes and the graph’s edges are the possible infection routes. Indeed, Wang et al. [19] proposed a graph-based Susceptible-Infected-Susceptible (SIS) model. In their settings, each individual is represented as a node in a static, connected, and random graph. Similarly, Hau et al. [20] proposed an SEIR (E-exposed) model for sexually transmitted diseases. The authors defined the interactions between individuals using a bipartite static graph. These approaches are shown to well capture the pandemic spread dynamics. However, they still depend on a precise approximation of the infection and recovery rates [20]. This is due to the resilience problem in the ordinary differential equations [6]. Formally, we define an *infection graph* to be a graph *G* := *(V , E* ⊂ *V* × *V )* where *V* are the nodes of the graph that represent individuals in a population with one of three epidemiological states (according to the SIR model’s definition) using a timed finite-state machine [21], and *E* is the set of possible epidemiological interaction between individuals that can cause infection. For example, two individuals who work together in the same room have an edge between them as they can infect each other.

Another possible approach to tackle the pandemic spread prediction task is using heat spread. The transformation of heat on manifold plays an important role in many fields of science and engineering [22–24]. Heat spread shown to be promising in both theoretical [25, 26] and practical settings [27, 28]. The heat spread can be represented using the following partial differential equation:

<div class="equation" id="eq-2"><img src="figures/eq-2.webp" width="300" height="41" alt="∂u(t, ¯x) ∂t = cu(t, ¯x), (2)" loading="lazy" decoding="async"></div>

where *u* : R<sup>n+1</sup> → R is a function, *t* is the time, ¯*x* is an *n*-dimensional space, and *c* ∈ R<sup>+</sup> is the diffusion coefficient. The diffusion coefficient, *c*, can be treated as the average rate in which a physical area is heated. In our case, the average rate a pathogen is gathered inside an individual’s body. We note that the classical definition of the function *U* is the temperature. However, additional interpolations can be applied. For instance, probability of the arrival of information. The second definition is spatially discrete compared to the proposed continuous definition proposed in Eq. (2). A discrete version of the heat spread equations takes the form:

<div class="equation" id="eq-3"><img src="figures/eq-3.webp" width="313" height="47" alt="∂u(t, ¯x) ∂t = cn i=0 ∂2u(t, ¯x) ∂x2 i (3)" loading="lazy" decoding="async"></div>

such that

<div class="equation" id="eq-4"><img src="figures/eq-4.webp" width="190" height="41" alt="∂u(t, ¯x) ∂t := u(t + h, ¯x) −u(t, ¯x) h" loading="lazy" decoding="async"></div>

and

<div class="equation" id="eq-5"><img src="figures/eq-5.webp" width="383" height="43" alt="∂u(t, ¯x) ∂xi := u(t, [x1, . . . , xi + h, . . . xn]) −u(t, [x1, . . . , xi, . . . xn]) h ," loading="lazy" decoding="async"></div>

where *h* ∈ R<sup>+</sup>\\{0} [29].

Graphs are locally, on the node-level, isometric to manifold with a dimensional corresponding to the number of neighbors of the center node. Hence, assuming a graph *G* := *(V , E)*, the heat spread dynamics for each node *v* ∈ *V* agrees with Eq. (3) such that *h* = 1 and *n* = |{*v*<sub>i</sub> ∈ *V* | *(v, v*<sub>i</sub>*)* ∈ *E*}|.

Following this, one can conclude that knowledge is required to obtain a fine approximation of the heat spread in an interaction graph. Specifically, only information on the interaction between individuals is needed. While the stochastic graph-based *SIR* model is based on more precise biological, social, and epidemiological knowledge, this information is not necessarily available during the beginning of a pandemic.

Thus, one can use the diffusion spread model, which requires less information and thus easier to approximate, to obtain an initial upper-bounded estimation to the pandemic spread compared to the SIR-based model. Nonetheless, as far as we aware of, no such comparison has been investigated so far. To fill this gap, we propose two upper boundaries for the pandemic spread in the population based on the heat spread coefficient. Our method is based on the heat spread on interaction graphs. This allows us to provide policymakers with a range of insights based on the connection between the two. This paper is organized as follows: in Sect. 2, we present two upper boundaries (*maximum* and *mean*) of a stochastic graph-based *SIR* model using the heat spread. In Sect. 3, we evaluate the usefulness of the proposed boundaries in a *k*-regular and random graphs. Following this, we evaluate the boundaries on social network data from Facebook to simulate realistic interaction graph settings. In Sect. 4, we discuss the possible epidemiological usage of these boundaries with their limitations and propose future work.

## 2 Pandemic spread bounded by heat spread

To formalize the heat equation on a single node, one needs to calculate the probability of the node being *infected*. The probability a node *i* with |*N*<sub>b</sub>*(i)*| adjacent nodes (*N*<sub>b</sub>*(i)* is the set of adjacent nodes to node *i*) would be infected is corresponding to the probability that each infected adjacent node (*v j* ∈ *N*<sub>b</sub>*(i)*) would infect node *i*.

<div class="equation" id="eq-6"><img src="figures/eq-6.webp" width="366" height="42" alt="pi(infected) := 1 − j∈Nb(i) 1 −p j(infected) , (4)" loading="lazy" decoding="async"></div>

such that *p j(*infected*)* = 0 if node *j* is not infected and some probability *p* ∈ *(*0*,* 1] otherwise.

Based on these dynamics, we formally define the epidemiological interaction graph as follows. Let *G* := *(V , E)* be a underacted, connected graph such that *E* ⊂ *V* × *V* and |*V* | = *N*. Each node *v* ∈ *V* is representing an individual in the population. A node is defined by a finite-state machine with three states {*S, I, R*}—corresponding to the *SIR* model’s epidemiological states. In addition, the edge *e* = *(v*<sub>i</sub>*, v j)* ∈ *E* is a possible interaction between two individual *v*<sub>i</sub>*, v j* ∈ *V* such that *i*/ = *j*.

Following this, a stochastic *SIR* on an infection graph can be defined as follows. Given an infection graph *(G)* and the parameters *β, γ* ∈ *(*0*,* 1]. At a given point in time, if *v j* ∈ *N*<sub>b</sub>*(v*<sub>i</sub>*)* ∧ *v j* ∈ *S* ∧ *v*<sub>i</sub> ∈ *I*, than *v j* infected. Viz, *v j* transforms to state *I* at a probability *β*. In addition, if *v*<sub>i</sub> ∈ *I* than *v*<sub>i</sub> recover. Namely, transforms to state *R* at a probability *γ* . The process is terminated when *I* reaches zero. Lazebnik et al. [16] had proved that the only recurrent state for the stochastic *SIR* model is *(S, I, R)* = *(N* − *d,* 0*, d)* such that 1 ≤ *d* ≤ *N*. Thus, the asymptotic state of the dynamics is achieved when *I* = 0. Therefore, the process halts.

Akin, one can define the heat spread on an infection graph as follows. Given an infection graph *(G)* and the parameter *c* ∈ R<sup>+</sup>. At a given point in time, if *v j* ∈ *N*<sub>b</sub>*(v*<sub>i</sub>*)* ∧ *v j* ∈ *S* ∧ *v*<sub>i</sub> ∈ *I*, then *v j* becomes infected. That is, *v j* transforms to state *I* after ⌈<sup>1</sup> <sub>c</sub>⌉ time steps. Moreover, if *v*<sub>i</sub> ∈ *I* then *v*<sub>i</sub> recovered. Namely, transforms to state *R* if ∀*v j* ∈ *N*<sub>b</sub>*(v*<sub>i</sub>*)* such that *v j* ∈ *I*. The process is terminated when *I* reaches zero. By treating the dynamics as a Markovian process [30], one can notice that the only recurrent state of the process takes the form *(S, I, R)* = *(*0*,* 0*, N)*. This happens because all individuals would eventually be infected and recover, assuming a connected graph. Hence, the asymptotic state of the dynamics is achieved when *I* = 0. Consequently, the process halts.

Based on these definitions, given an interaction graph that represents a population, one can bound the pandemic spread according to the stochastic *SIR* model using the heat spread model as shown in Theorem 1. In the following, we will show that the basic infection rate of the SIR model is dominated by the basic infection rate of the diffusion process.

**Theorem 1** *Given an infection graph (G) with infection rate β* ∈ *(*0*,* 1] *and recovery rate γ* ∈ *(*0*,* 1]*. In addition, assuming the initial condition (S, I, R)* = *(N* −1*,* 1*,* 0*). Thus, exists a diffusion rate c* ∈ R<sup>+</sup> *that agrees with:*

<div class="equation" id="eq-7"><img src="figures/eq-7.webp" width="346" height="30" alt="∀t ∈N : RSIR(β,γ ) 0 (t) ≤RDiffusion(c) 0 (t), (5)" loading="lazy" decoding="async"></div>

*where R*<sup>SIR(β,γ )</sup> *(t) is the basic infection rate of the SIR model. Namely,* 0

<div class="equation" id="eq-8"><img src="figures/eq-8.webp" width="408" height="42" alt="RSIR(β,γ ) 0 (t) := max(0, R(t) −R(t −1) + I (t) −I (t −1) max(1, R(t) −R(t −1)) ) ≤β γ I (t −1)" loading="lazy" decoding="async"></div>

*for a graph-based SIR model with infection rate β and recovery rate γ , and R*<sup>Diffusion(c)</sup>*(t) is the basic infection rate of the diffusion model. I.e.,* 0

<div class="equation" id="eq-9"><img src="figures/eq-9.webp" width="413" height="41" alt="RDiffusion(c) 0 (t) := max(0, R(t) −R(t −1) + I (t) −I (t −1) max(1, R(t) −R(t −1)) ) ≤cI(t −1)" loading="lazy" decoding="async"></div>

*for a graph-based heat spread model with diffusion rate c. Of note, while the definitions of both R*<sub>0</sub> *metrics are identical when represented using the SIR’s model states (i.e., S(t), I (t), R(t)), they are not identical in practice due to the differences in the dynamics.*

***Proof*** Let *v*<sub>0</sub> be the node which satisfies *v* ∈ *I* at *t* = 0. Node *v*<sub>0</sub> is a single node according to the assumptions. Performing a breadth-first search (BFS) [31] starting from *v*<sub>0</sub>. During the BFS, each node *v* ∈ *G* has been allocated with a distance *d* from *v*<sub>0</sub>. I.e., *d(v*<sub>0</sub>*, v)* is the length of the shortest path between *v*<sub>0</sub> and *v* in the graph, *G*. On one hand, for the stochastic *SIR* process, the worst case scenario obtained where *β* = 1 and *γ* = *ϵ >* 0. This happens as larger *β* and smaller *γ* increase the pandemic spread. In this case,

<div class="equation" id="eq-10"><img src="figures/eq-10.webp" width="416" height="31" alt="RSIR(β,γ ) 0 ≤RSIR(1,ϵ) 0 ≤maxk∈[1,N−1](|{v ∈V | d(v0, vi) = k}|). (6)" loading="lazy" decoding="async"></div>

Intuitively, max<sub>k∈[1,N−1]</sub>*(*|{*v* ∈ *V* | *d(v*<sub>0</sub>*, v)* = *k*}|*)* is the infection front of the graph as all nodes (individuals) in the graph that are neighboring an infected nodes are the largest set of individuals that can be infected in a single step in time. By setting the diffusion rate *c* to be max<sub>k∈[1,N−1]</sub>*(*|{*v* ∈ *V* | *d(v*<sub>0</sub>*, v)* = *k*}|*)*, for any infection rate *β* ∈ *(*0*,* 1] and recovery rate *γ* ∈ *(*0*,* 1], the condition

<div class="equation" id="eq-11"><img src="figures/eq-11.webp" width="346" height="30" alt="∀t ∈N : RSIR(β,γ ) 0 (t) ≤RDiffusion(c) 0 (t), (7)" loading="lazy" decoding="async"></div>

satisfied.

⊓⊔ A corollary of Theorem 1 is that the pandemic spread and heat spread are isomorphic where *β* = *c* = 1 and *γ* = 0. This is true since, the processes are defined to be isomorphic if and only if ∀*t* ∈ N : |{*v* ∈ *V* | *v* ∈ *I*}| is identical for both processes. In addition, an isomorphism analysis between the two models is provided in the Appendix.

**Definition 2.1** The *event horizon* is the set of nodes *H* which satisfies:

<div class="equation" id="eq-12"><img src="figures/eq-12.webp" width="308" height="24" alt="H := {vi ∈V | i/ = j ∧v j ∈Nb(vi) : v j ∈I ∧vi ∈S}" loading="lazy" decoding="async"></div>

Following this, one can point out that, at time *t* = 0 in both processes the size of infected nodes depends on the interaction graph. For each step in time, the event horizon *H* ⊂ *V* is infected, while the other nodes are not. This means both processes are deterministically identical for *β* = *c* = 1 and *γ* = 0.

While this boundary holds for any pandemic, we note that this boundary is not tied for the most realization of a pandemic. This is due to the high variance in the pandemic spread [11, 32, 33]. Therefore, one can bound the mean pandemic spread given the interaction graph, as shown in Theorem 2. The mean pandemic spread provides a more tied boundary of the pandemic spread given only the infection rate *β*.

**Theorem 2** *Given an infection graph (G) with infection rate β* ∈ *(*0*,* 1] *and recovery rate γ* ∈ *(*0*,* 1]*. In addition, assuming the initial condition (S, I, R)* = *(N* −1*,* 1*,* 0*). The vector of mean infection time (V* <sup>i</sup> <sub>j</sub> *) agrees with the minimal (e.g., if x j is another solution with x j* ≥ 0 *then x j* ≥ *V* <sup>i</sup> <sub>j</sub> *) non-negative solution of the following equation:*

<div class="equation" id="eq-13"><img src="figures/eq-13.webp" width="328" height="50" alt="V i j = 1 β + k≠ jβV i k , i/ = j V i j = 0, otherwise , (8)" loading="lazy" decoding="async"></div>

*where V* <sup>i</sup> <sub>j</sub> ∈ N∪∞*is a random variable that stands for the time pass that an infection that starts at individual i will infect individual j. We define the “hitting time” of a state i* ∈ *V as a random variable H*<sup>i</sup> : *V* → N ∪∞ *given by*

<div class="equation" id="eq-14"><img src="figures/eq-14.webp" width="188" height="27" alt="Hi(v) = inf {n ≥0 : V i n(v) = j}" loading="lazy" decoding="async"></div>

***Proof*** First, we show that *V* <sup>i</sup> <sub>j</sub> satisfies Eq. (8). If *i* = *j* than *H*<sup>i</sup> = 0 by definition and therefore *V* <sup>i</sup> <sub>j</sub> = 0. If *i*/ = *j*, than *H*<sup>i</sup> ≥ 1. According to the Markov property,

<div class="equation" id="eq-15"><img src="figures/eq-15.webp" width="182" height="39" alt="Ei(Hi|V1 = j) = 1 β + E j(Hi)." loading="lazy" decoding="async"></div>

**Fig. 1** A schematic view of a *ladder* graph and

<div class="equation" id="eq-16"><img src="figures/eq-16.webp" width="433" height="48" alt="V i j = E j(Hi) = k∈V Ei(Hi1V1=k) = k∈V Ei(Hi|V1 = k)Pi(V1 = k) = 1 β + k≠ jβV i k . (9)" loading="lazy" decoding="async"></div>

Suppose that *y* is any solution to Eq. (8). Then, for *i* = *j*, *V* <sup>i</sup> <sub>j</sub> = *y* = 0. If *i*/ = *j*,

<div class="equation" id="eq-17"><img src="figures/eq-17.webp" width="420" height="46" alt="y = 1 β + k≠ jβyk = 1 β + k≠ jβ 1 + l≠ j(βyk,l) = P(Hi ≥1) +P(Hi ≥2) + . . . (10)" loading="lazy" decoding="async"></div>

By repeating this substitution for *y*, in the final term (after *n* steps), we obtain

<div class="equation" id="eq-18"><img src="figures/eq-18.webp" width="329" height="28" alt="y ≥P(Hi ≥1) + . . . P(Hi ≥n) (11)" loading="lazy" decoding="async"></div>

and, by letting *n* →∞,

<div class="equation" id="eq-19"><img src="figures/eq-19.webp" width="315" height="29" alt="y ≥∞ n=1P(V i j ≥n) = V i j . (12)" loading="lazy" decoding="async"></div>

<div class="equation" id="eq-20"><img src="figures/eq-20.webp" width="16" height="21" alt="⊓⊔" loading="lazy" decoding="async"></div>

***Example 1*** In the *ladder* graph, as illustrated in Fig. 1, the inequality in Eq. (8) is sharp. For that, two insights can be concluded. The first one is that each infection path is independent. Namely, if one path is faster or slower it is orthogonal to any other path. The second is that there exists a positive probability realization that the node would be infected by another path than the shortest path. This implies that when one calculates the expected infection time, he would get a lower time than taking only the shortest path.

**Corollary 2.1** *Given an infection graph with a fixed infection rate β* ∈ *(*0*,* 1*) and recovery rate γ* ∈ *(*0*,* 1*). The infection rate would strictly increase by adding infection paths.*

We note that for a single adjacent node, the boundary in Eq. (8) is tight. It can be monotonically relaxed by increasing the number of adjacent nodes, *γ* , and *β*.

According to Theorem 1 and 2, for *β* = *c* and *γ* = 0, the processes are converging to the same mean. Thus, in the case *γ >* 0, the heat spread with diffusion rate *c* = *β* is an upper boundary of the mean case of the stochastic *SIR* dynamics. This outcome can be obtained by computing the mean infection time from the first infected individual to any other individual in the population. Following this step, one needs to compute the inverse value for this quanta to obtain the mean pandemic spread rate. Nonetheless, using this boundary requires a good approximation of the infection rate (*β*). Otherwise, the boundary may be either too high or too low. In the case of the first boundary (Eq. 5), such knowledge is not required.

<figure id="fig-2">
<img src="figures/fig-2.webp" width="703" height="318" alt="The mean basic reproduction number as a function of the k-regularity of the interaction graph" loading="lazy" decoding="async">
<figcaption><strong>Fig. 2</strong> The mean basic reproduction number as a function of the <em>k</em>-regularity of the interaction graph. The values provided for the stochastic <em>SIR</em> model (blue circles), mean diffusion boundary (gray axis), and maximum diffusion boundary (black triangles). Each sample is shown as mean ± standard deviation for <em>n</em> = 10</figcaption>
</figure>

## 3 Numerical simulations

Based on the proposed theoretical bounds on the pandemic spread, and since these bounds are not tight for some cases, we further investigate them numerically. In this section, we numerically examine the spread dynamics on several graph types. For each graph, we calculate the stochastic *SIR* spread and associated heat spread models.

In particular, *k*-regular graphs, random graphs, and a real-world social interaction graph. We computed the pandemic spread with infection rate of *β* = 0*.*07 and recovery rate of *γ* = 0*.*07. These values were chosen to represent the COVID-19 pandemic [33]. Additionally, according to Theorems 1 and 2, the *maximum* and *mean* diffusion rates are set to be 1 and 0*.*07, respectively.

First, we obtain the connection between the *k*-regularity of a graph and the pandemic spread. In plain English, we computed the mean basic reparation number (*R*<sub>0</sub>) of the pandemic. We choose this metric because it is commonly considered to be the proper metric to measure overall pandemic spread [34, 35]. We randomly generated *n* = 10 connected, *k*-regular graphs with |*V* | = 1000. The results of this process are presented in Fig. 2, where the x-axis is the value of *k* and the y-axis is the mean basic reparation number.

Since interaction graphs are not necessarily *k*-regular, we computed the mean basic reproduction number for connected, random graphs. The graphs were randomly generated such that each node *v* ∈ *V* has between 3 and 200 edges, sampled using a uniform distribution. We generated 100 samples for graphs at size |*V* | = 1000. The results of this process are presented in Fig. 3. Where the x-axis is the number of edges in the graph (|*E*|) and the y-axis is the mean basic reparation number.

<figure id="fig-3">
<img src="figures/fig-3.webp" width="703" height="312" alt="The mean basic reproduction number as a function of the interactions graph’s connectivity (e.g., |E|)" loading="lazy" decoding="async">
<figcaption><strong>Fig. 3</strong> The mean basic reproduction number as a function of the interactions graph’s connectivity (e.g., |<em>E</em>|). The values for the stochastic<em>SIR</em> model, mean diffusion boundary, and maximum diffusion boundary are provided</figcaption>
</figure>

The above graphs were constructed synthetically. Thus, a natural question that rise is “does this model words on real-life graphs?”. To answer this question, we tested the model on the Facebook interaction graph. This graph represents the friendships between individuals in the Facebook social platform [36]. For our needs, each individual is set to be a node in the infection graph and each friendship between individuals is assumed to define a possible physical meeting between the individuals and therefore a possible infection route, making it an edge in the infection graph. It contains |*V* | = 4039 nodes and |*E*| = 176*,* 468 edges (1.01% density). Each node *v* ∈ *V* has 44 ± 52 neighbors. A histogram of the number of neighbors per node is provided in the supplementary material. We calculated the pandemic spread for the maximum heat spread boundary, the mean heat spread boundary, and the stochastic *SIR* model, as shown in Fig. 4a–c, respectively.

## 4 Discussion

Estimating the infection rate is critical information for pandemic management [7, 20]. In this paper, we showed boundaries on the infection rate. By using the heat spread dynamics with different diffusion rates, we learned that the rate is highly dependent on the topology of the interaction graph. The boundaries of a stochastic *SIR* model’s infection rate were assumed to take place on an interaction graph. This provides a better representation of the epidemiological dynamics in a heterogeneous population. Health professionals would benefit from the representation we provide. Since the proposed boundaries are relatively easy to obtain as they require almost no prior data. Specifically, we presented the *worst case* (also called the *maximum case*) and the *mean case* pandemic spread boundaries. This is especially useful at the beginning of a pandemic since acting fast can significantly reduce overall infection [10]. For example, during the COVID-19 pandemic [37], the infection and recovery rates were rapidly update [15, 33, 38–40]. This led to large errors in the estimations of the pandemic’s spread. As a result, policymakers are provided with a distorted image. Hence, the proposed boundaries provide an initial solution. Once more data are gathered, one would be able to both improve the proposed boundaries and use more sophisticated and adjusted models.

<figure id="fig-4">
<img src="figures/fig-4.webp" width="703" height="450" alt="The pandemic spread over time for the Facebook [36] infection graph such that the susceptible, infected, and recovered normalized group sizes are donated by S, I, and R, respectively" loading="lazy" decoding="async">
<figcaption><strong>Fig. 4</strong> The pandemic spread over time for the Facebook [36] infection graph such that the susceptible, infected, and recovered normalized group sizes are donated by <em>S</em>, <em>I</em>, and <em>R</em>, respectively</figcaption>
</figure>

The *maximum* heat spread boundary is deterministic tight. Therefore, it cannot be improved. Nonetheless, this case represents a catastrophic scenario where *β* = 1*, γ* = 0. This case may cause unnecessary panic and extreme reactions. Obviously, these are not necessarily required to contain the pandemic spread. However, if slightly more information is provided such as the approximation of the infection rate (*β*), one can obtain a better approximation of the infection spread rate. Indeed, in such a case, we can use the *mean* heat spread boundary. This boundary provides a tighter approximation to the stochastic *SIR* model. This is done without knowing the recovery rate or anything on the interaction graph, as shown in Fig. 3. Withal, the *mean* heat spread boundary is constituent in providing a mean boundary over the stochastic *SIR*. This is significantly less than the *maximum* heat spread boundary over different levels of connectivity in the population, as shown in Fig. 2. In fact, when applied to the Facebook interaction graph [36], the *maximum* and *mean* heat spread boundaries provided 20 and 1*.*66 times greater pandemic spread rate on average compared to the stochastic *SIR* model, as shown in Fig. 4.

The usage of heat spread as the boundary for the pandemic spread is useful in real settings as one can find the diffusion rate *c* from local infection spread. For comparison, this method does not work for obtaining the infection rate (*β*) and recovery rate (*γ* ). Therefore, it is faster and more feasible to obtain the heat spread boundaries to the pandemic rather than the *SIR*-based pandemic spread parameters. Thus, while the SIR model is useful, at the beginning of the pandemic where little to no biological and epidemiological knowledge is available, one can first bound the pandemic spread using the diffusion model and later replace it with the SIR one for a more accurate prediction.

A possible future work can be removing the assumption that the interaction graph is static over time. Specifically, one can allow the edges of the graph to change according to some socio-epidemiological logic. This relaxation would lead to a better representation of the pandemic spread in a population. As a result, this can reveal even better boundaries to the pandemic spread.

**Acknowledgements** None.

**Author Contributions** TL contributed toward conceptualization; acquisition of data; formal analysis; investigation; methodology; project administration; software; visualization; writing—original draft; writing— review & editing. UI contributed toward conceptualization; investigation; methodology; writing—review & editing.

**Funding** This research did not receive any specific grant from funding agencies in the public, commercial, or not-for-profit sectors.

**Data Availability** All the data that have been used are available online. In the manuscript, we provide links and cite the works that originally presented the data sets.

## Declarations

**Conflict of interest** The authors declare that they have no conflict of interest.

**Code availability** Upon acceptance, we will publish all the code used in a GitHub repository with technical documentation for easy usage.

## References

1. Conti AA (2020) Historical and methodological highlights of quarantine measures: from ancient plague epidemics to current coronavirus disease (COVID-19) pandemic. Acta Biomed 91(2):226–229
2. Goldstein JR, Lee RD (2020) Demographic perspectives on the mortality of COVID-19 and other epidemics. In: PNAS 117.36, pp 22035–22041
3. Herrera H, Ordonez G, Konradt M, Trebesch C (2020) Corona politics: the cost of mismanaging pandemics. PIER Working Paper No. 20-033. In: SSRN
4. Roberts A (2020) Pandemics and politics. Survival 62(5):7–40
5. Lazebnik T, Shami L, Bunimovich-Mendrazitsky S (2021) Pandemic Management by a Spatiotemporal Mathematical Model. In: International Journal of Nonlinear Sciences and Numerical Simulation
6. Vinay C, Vikas H, Sakshi G, Adit G, Mohsen G, Biplab S (2020) Disaster and pandemic management using machine learning: a survey. IEEE Internet Things J 8(21):16047–16071
7. Kermack WO, McKendrick AG (1927) A contribution to the mathematical theory of epidemics. Proc R Soc 115:700–721
8. Davenport TH, Godfrey AB, Redman TC (2020) To fight pandemics, we need better data. MIT Sloan Manag Rev 62(1):1–4
9. Corsi A, de Souze FF, Pagani RN, Kovaleski JL (2020) Big data analytics as a tool for fighting pandemics: a systematic review of literature. J Ambient Intell Hum Comput 12(10):9163–80
10. Tran TPT, Le TH, Nguyen TNP, Hoang VM (2020) Rapid response to the COVID-19 pan- demic: Vietnam government’s experience and preliminary success. J Glob Health 10(2):020502
11. Yang W, Zhang D, Peng L, Zhuge C, Liu L (2020) Rational evaluation of various epidemic models based on the COVID-19 data of China. In: medRxiv 344
12. Darabi SF, Scoglio C (2011) Epidemic spread in human networks. In: 50th IEEE Conference on Decision and Control and European Control Conference, pp 3008–3013
13. Friji H, Hamadi R, Ghazzai H, Besbes H, Massoud Y (2021) A generalized mechanistic model for assessing and forecasting the spread of the COVID-19 pandemics. IEEE Access 9:13266–13285
14. Masandawa L, Mirau SS, Mbalawata IS (2021) Mathematical modeling of COVID-19 transmission dynamics between healthcare workers and community. IEEE Access 9:13266–13285
15. Ifguis O, El Ghozlani M, Ammou F, Moutcine A, Abdellah Z (2020) Simulation of the final size of the evolution curve of coronavirus epidemic in Morocco using the SIR model. J Environ Public Health
16. Lazebnik T, Bunimovich-Mendrazitsky S, Shaikhet L (2021) Novel method to analytically obtain the asymptotic stable equilibria states of extended SIR-type epidemiological models. In: Symmetry
17. Cortés J-C, El-Labany SK, Navarro-Quiles A, Selim MM, Slama H (2020) A comprehensive probabilistic analysis of approximate SIR-type epidemiological models via full randomized discrete-time Markov chain formulation with applications. Math Methods Appl Sci 43(14):8204–8222
18. Noakes CJ, Beggs CB, Sleigh PA, Kerr KG (2006) Modelling the transmission of airborne infections in enclosed spaces. Epidemiol Infect 134:1082–1091
19. Wang X, Wang Z, Shen H (2019) Dynamical analysis of a discrete-time SIS epidemic model on complex networks. Appl Math Lett 94:292–299
20. Huo H-F, Yang Q, Xiang H (2019) Dynamics of an edge-based SEIR model for sexually transmitted diseases. Math Biosci Eng 17:669–699
21. Alagar VS, Periyasamy K (2011) Extended finite state machine. Specification of software systems. Springer, London, pp 105–128
22. Yu WM, Xiaoming W (2004) PDE-driven level sets, shape sensitivity and curvature flow for structural topology optimization. Comput Model Eng Sci 6(4):373–395
23. Cerda J, Westerberg AW, Mason D, Linnhoff B (1983) Minimum utility usage in heat exchanger network synthesis. A transportation problem. Chem Eng Sci 38(3):373–387
24. Dbouk T (2017) A review about the engineering design of optimal heat transfer systems using topology optimization. Appl Therm Eng 112:841–854
25. Cole KD, Yavari MR, Rao PK (2003) Computational heat transfer with spectral graph theory: quantitative verification. Int J Therm Sci 153:106383
26. Naveros I, Ghiaus C, Ordonez J, Ruiz DP (2016) Thermal networks considering graph theory and thermodynamics. In: 12th International Conference on Heat Transfer, Fluid Mechanics and Thermodynamics
27. Anderson HE (1969) Heat transfer and fire spread. In: Res. Pap. INT-RP-69. Ogden, Utah: U.S. Department of Agriculture, Forest Service, Intermountain Forest and Range Experiment Station, p 20
28. Brydena KM, Ashlockb DA, McGregory DS, Urbana GL (2003) Optimization of heat transfer utilizing graph based evolutionary algorithms. Int J Heat Fluid Flow 21(2):267–277
29. Fornberg B (1981) Numerical differentiation of analytic functions. ACM Trans Math Softw 4:512–526
30. Privault N (2018) Understanding Markov chains. Springer, Singapore
31. Moore EF (1959) The shortest path through a maze. In: Proceedings of the International Symposium on the Theory of Switching, pp 285–292
32. Bunimovich-Mendrazitsky S, Stone L (2005) Modeling polio as a disease of development. J Theor Biol 237:302–315
33. Lazebnik T, Bunimovich-Mendrazitsky S (2021) The signature features of COVID-19 pandemic in a hybrid mathematical model—implications for optimal work-school lockdown policy. In: Advanced theory and simulations
34. Alimohamadi Y, Taghdir M, Sepandi M (2020) Estimate of the basic reproduction number for COVID- 19: a systematic review and meta-analysis. J Prev Med Public Health 53(3):151–157
35. Lazebnik T, Alexi A (2022) Comparison of pandemic intervention policies in several building types using heterogeneous population model. Commun Nonlinear Sci Numer Simul 107(4):106176
36. McAuley J, Leskovec J (2012) Learning to Discover Social Circles in Ego Networks. In: Advances in Neural Information Processing Systems 25
37. Eurosurveillance Editorial Team (2020) Note from the editors: World Health Organization declares novel coronavirus (2019-nCoV) sixth public health emergency of international concern. In: Euro Surveill 25, 200131e
38. Chen J, Qi T, Liu L, Ling Y, Qian Z, Li T (2020) Clinical progression of patients with COVID-19 in Shanghai, China. J Infect 80(5):e1–e6
39. Lechien JR, Chiesa-Estomba CM, Place S, Van Laethem Y, Cabaraux P, Mat Q (2020) Clinical and epidemiological characteristics of 1420 European patients with mild-to-moderate coronavirus disease 2019. J Intern Med 288(3):335–344
40. Wu J, Li W, Shi X, Chen Z, Jiang B, Liu J (2020) Early antiviral treatment contributes to alleviate the severity and improve the prognosis of patients with novel coronavirus disease (COVID-19). J Intern Med 288(1):128–138
