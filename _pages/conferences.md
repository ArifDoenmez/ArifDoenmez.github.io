---
layout: page
permalink: /conferences/
title: conferences
description: attended conferences & <b>talks</b> & <b>poster</b>
years: [2013, 2012, 2011]
nav: true
nav_order: 3
---

<!-- _pages/publications.md -->
<div class="publications">

{%- for y in page.years %}
  <h2 class="year">{{y}}</h2>
  {% bibliography -f conferences -q @*[year={{y}}]* %}
{% endfor %}

</div>
