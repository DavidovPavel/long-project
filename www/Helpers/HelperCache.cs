using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Web;
using System.Web.Caching;
using System.Web.Hosting;
using ANBR.SemanticArchive.DataContracts.EntityObject;
using ANBR.SemanticArchive.SDK;

namespace www.Helpers
{
    public static class HelperCache
    {
        public static object _sync = new object();

        /// <summary>
        /// Возвращает или добавляет значение по заданному ключу (threadsafe)
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="key"></param>
        /// <param name="getValue"></param>
        /// <param name="absuluteExpiration"></param>
        /// <param name="slidingExpiration"></param>
        /// <returns></returns>
        public static T CacheGetOrAdd<T>(string key, Func<T> getValue, DateTime? absuluteExpiration, TimeSpan? slidingExpiration)
        {
            var data = (T)HttpRuntime.Cache[key];
            if (data == null)
            {
                lock (_sync)
                {
                    data = (T)HttpRuntime.Cache[key];
                    if (data == null)
                    {
                        if (!absuluteExpiration.HasValue) absuluteExpiration = Cache.NoAbsoluteExpiration;
                        if (!slidingExpiration.HasValue) slidingExpiration = Cache.NoSlidingExpiration;

                        data = getValue();
                        HttpRuntime.Cache.Add(key, data, null, absuluteExpiration.Value, slidingExpiration.Value, CacheItemPriority.Default, null);
                    }
                }
            }

            return data;
        }

        /// <summary>
        /// Записывает значение по заданному ключу. Если значение уже задано - переписывает его (threadsafe)
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="key"></param>
        /// <param name="getValue"></param>
        /// <param name="absuluteExpiration"></param>
        /// <param name="slidingExpiration"></param>
        public static void CacheAdd<T>(string key, Func<T> getValue, DateTime? absuluteExpiration, TimeSpan? slidingExpiration)
        {
            if (!absuluteExpiration.HasValue) absuluteExpiration = Cache.NoAbsoluteExpiration;
            if (!slidingExpiration.HasValue) slidingExpiration = Cache.NoSlidingExpiration;

            var data = getValue();
            lock (_sync)
                HttpRuntime.Cache.Insert(key, data, null, absuluteExpiration.Value, slidingExpiration.Value, CacheItemPriority.Default, null);
        }


        /// <summary>
        /// Главный объект содержит множество синонимов заданной тематики, которые используются для подсветки фрагментов в виджете типа "Источник"
        /// Получает данные по главным объектам из кэша
        /// </summary>
        /// <returns></returns>
        public static Tuple<List<string>, List<string>> MainObjectDataGetFromCache(IDataBase saDb, int[] mainIds)
        {
            return PrepareCacheForQuery(saDb, mainIds);
        }

        /// <summary>
        /// Главный объект содержит множество синонимов заданной тематики, которые используются для подсветки фрагментов в виджете типа "Источник"
        /// Добавляет перечень главных объектов в кэш (1 час)
        /// </summary>
        public static void MainObjectDataAddToCache(IDataBase saDb, int[] mainIds)
        {
            if (mainIds != null && mainIds.Any())
            {
                HostingEnvironment.QueueBackgroundWorkItem(ct =>
                {
                    PrepareCacheForQuery(saDb, mainIds);
                });
            }
        }

        /// <summary>
        /// Подготавливает объекты-контейнеров, которые содержат ключевых слова для подсветки
        /// Кэширует на 1 час
        /// </summary>
        /// <returns>
        /// Item1 - подготовленный для поиска список слофоформ для одного простого слова и фразы "как есть";
        /// Item2 - список фраз требующий поиска словоформ
        /// </returns>
        private static Tuple<List<string>, List<string>> PrepareCacheForQuery(IDataBase saDb, int[] mainIds)
        {

            Tuple<List<string>, List<string>> synListPureWithMorph = new Tuple<List<string>, List<string>>(new List<string>(), new List<string>());
            foreach (var oid in mainIds)
            {
                int mainObjectIDi = oid;
                if (mainObjectIDi != default(Int32))
                {
                    string key = saDb.Id + "$MainObjectID$Highlighting$" + mainObjectIDi;
                    var synList = (Tuple<List<string>, List<string>>)HttpRuntime.Cache[key];

                    if (synList == null)
                    {
                        var options = RegexOptions.IgnoreCase | RegexOptions.Singleline;
                        Regex re = new Regex("\\W+", options);

                        var forSearchReady = new List<string>();
                        var phrases = new List<string>();
                        List<Synonym> synListNative = saDb.ObjectService.GetEntitySynonym(mainObjectIDi);
                        List<string> synListPure = new List<string>();
                        foreach (var syn in synListNative)
                        {
                            if (!syn.ForHighLight) continue;
                            if (!syn.UseMorphologic)
                            {
                                forSearchReady.Add(syn.Value.Trim());
                                continue;
                            }

                            if (re.IsMatch(syn.Value.Trim()))
                            {
                                forSearchReady.Add(syn.Value.Trim());
                                phrases.Add(syn.Value.Trim());
                                continue;
                            }

                            synListPure.Add(syn.Value.Trim());
                        }

                        var agr = new StringBuilder();
                        foreach (string form in synListPure)
                        {
                            if (agr.Length + form.Length + 1 > 500)
                            {
                                forSearchReady.AddRange(saDb.ServiceTools.GetWordForms(agr.ToString()));
                                agr = new StringBuilder(form);
                            }
                            else
                                agr.Append(" ").Append(form);
                        }
                        forSearchReady.AddRange(saDb.ServiceTools.GetWordForms(agr.ToString()));

                        synList = Tuple.Create(forSearchReady, phrases);
                        HttpRuntime.Cache.Add(key, synList, null,
                            DateTime.Now.AddHours(1), TimeSpan.Zero, CacheItemPriority.Default, null);
                    }

                    synListPureWithMorph.Item1.AddRange(synList.Item1);
                    synListPureWithMorph.Item2.AddRange(synList.Item2);
                }
            }

            return synListPureWithMorph;
        }
    }
}